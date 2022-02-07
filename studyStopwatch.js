class Icon extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render()
    }

    render() {
        let size = this.getAttribute('size')
        let type = this.getAttribute('type')
        let color = this.getAttribute('color')
        let span = document.createElement('span')

        let sizeString = 'md-' + size

        this.innerHTML = "";

        span.classList.add('material-icons')
        span.classList.add(sizeString)
        span.style.color = color

        span.innerHTML = type

        this.appendChild(span)
    }

    static get observedAttributes() {
        return ['type']
    }

    attributeChangedCallback() {
        this.render()
    }
}

class Info {
    //type : begin, pause / time : when the action executed / deltaTime : time passed after previous action
    constructor(type, time, deltaTime, memo="") {
        this.type = type;
        this.time = time;
        this.deltaTime = deltaTime / 1000
        this.memo = memo
    }
}

class StopwatchController {
    constructor() {
        this.isStopwatchWorking = false
        this.isStopwatchReseted = true
        this.timeIndicator = null;
        this.pausingStopwatchTimeIndicator = null
        // this.pausedTime = 0;
        this.pauseStartedTime = null;
        this.stopwatch = null;
        this.pausingStopwatch = null;
        this.startTime = null;
        this.studyRecord = [];
        this.resumeStartedTime = null;
        this.studyTime = 0
    }

    initializeStopwatch() {
        this.isStopwatchReseted = true
        this.startTime = new Date()
        // this.pausedTime = 0
        this.studyTime = 0
        this.resumeStartedTime = new Date()
        this.isStopwatchWorking = false;
        this.timeIndicator = document.querySelector("#time-indicator")
        this.pausingStopwatchTimeIndicator = document.querySelector("#pausing-time-indicator")
        // console.log(this.startTime)
        // setInterval(()=>{console.log(this.timeIndicator)}, 1000)
    }

    extractCSV(alertReset=true) {
        let csv = ""
        csv += `action,when,time pausing,time studying,memo\r\n`
        this.studyRecord.forEach((it) => {
            csv += `${it.type},${it.time},`
            switch (it.type) {
                case "begin":
                    csv += `,,\r\n`
                    break;
                case "resume":
                    csv += `${it.deltaTime},,${it.memo}\r\n`
                    break;
                case "pause":
                    csv += `,${it.deltaTime},${it.memo}\r\n`
                    break;
                case "record":
                    csv += `,${it.deltaTime},${it.memo}\r\n`
                    break;
            }
        })

        let downloadLink = document.createElement("a")
        let blob = new Blob(["\ufeff"+csv],  { type: "text/csv;charset=utf-8" })
        let url = URL.createObjectURL(blob)

        let now = new Date()
        let dateString = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`

        downloadLink.href = url
        downloadLink.download = dateString + '.csv'

        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)

        let skipAlert = document.querySelector("#skip-alert").checked
        if(skipAlert) {
            this.studyRecord = []
            return
        }

        if(alertReset) {
            let ans = confirm("공부를 이어하되 지금까지의 기록을 지우고 덮어쓰시겠습니까?")
            if(ans) {
                this.studyRecord = []
            }
        }
    }

    addRecord() {
        // console.log("addRecord")
        this.studyTime += new Date() - this.resumeStartedTime

        let ans = prompt("어떤 이유로 기록하시겠습니까?")
        this.studyRecord.push(new Info("record", new Date(), new Date() - this.resumeStartedTime, ans))
        this.resumeStartedTime = new Date()
        // console.log(this.studyRecord)
    }

    recordOrDownload() {
        let type = document.querySelector("#record-download").children[0].getAttribute("type")
        if(type === "download") {
            this.extractCSV()
        } else {
            this.addRecord()
        }
    }

    resetStopwatch() {
        this.initializeStopwatch()
        clearInterval(this.stopwatch)
        clearInterval(this.pausingStopwatch)
        this.updateTime()


        let skipAlert = document.querySelector("#skip-alert").checked

        if(skipAlert) {
            this.extractCSV()
        } else {
            let ans = confirm("미리 공부 기록을 백업해둘까요?")
            if(ans) {
                this.extractCSV(false)
            }
            this.studyRecord = []
        }

        document.querySelector("#stop-pause").children[0].setAttribute("type", "play_arrow")
        document.querySelector("#record-download").children[0].setAttribute("type", "download")

        document.querySelectorAll('.change-when-paused').forEach((elem, _) => {
                elem.classList.remove("pausing")
            }
        )
    }
    millisecondsToTimeString(deltaTime) {
        let seconds = Math.floor(deltaTime / 1000)
        let hour = Math.floor((seconds/ 3600))
        let min = Math.floor((seconds % 3600) / 60)
        let deciseconds = Math.floor((deltaTime - seconds * 1000) / 100)
        seconds %= 60
        return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${deciseconds}`
    }

    updateTime() {
        // console.log(this.pausedTime)
        let deltaTime = (new Date() - this.resumeStartedTime + this.studyTime)
        // let timeString = "" + (time/3600/1000) + ":" + (time/3600)
        this.timeIndicator.textContent = this.millisecondsToTimeString(deltaTime)
    }

    updatePausingTime() {
        let deltaTime = (new Date() - this.pauseStartedTime)
        this.pausingStopwatchTimeIndicator.textContent = this.millisecondsToTimeString(deltaTime)
    }

    toggleStopwatch(event, ask=true) {
        // console.log(this.isStopwatchWorking)
        // console.log(this.timeIndicator)
        // console.log(this.startTime)
        // event.target.childNodes[0].childNodes[0].textContent = "pause"
        if(this.isStopwatchWorking) {
            clearInterval(this.stopwatch)
            this.pausingStopwatchTimeIndicator.textContent = "00:00:00.0"
            this.studyTime += new Date() - this.resumeStartedTime

            setTimeout(()=> {
                if(ask) {
                    let ans = prompt("왜 타이머를 중지하나요?")
                    // console.log(ans)
                    this.pauseStartedTime = new Date()
                    this.studyRecord.push(new Info("pause", this.pauseStartedTime, this.pauseStartedTime - this.resumeStartedTime, ans))
                } else {
                    this.pauseStartedTime = new Date()
                    this.studyRecord.push(new Info("pause", this.pauseStartedTime, this.pauseStartedTime - this.resumeStartedTime, "스톱워치 이탈"))
                }
                this.pausingStopwatch = setInterval(()=>{
                    this.updatePausingTime()
                }, 1000/50)

            }, 400)
            document.querySelector("#stop-pause").children[0].setAttribute("type", "play_arrow")
            document.querySelector("#record-download").children[0].setAttribute("type", "download")
            document.querySelectorAll('.change-when-paused').forEach((elem, _) => {
                elem.classList.add("pausing")
                }
            )
        } else {
            clearInterval(this.pausingStopwatch)

            document.querySelector("#stop-pause").children[0].setAttribute("type", "pause")
            document.querySelector("#record-download").children[0].setAttribute("type", "history")

            document.querySelectorAll('.change-when-paused').forEach((elem, _) => {
                    elem.classList.remove("pausing")
                }
            )
            if(this.isStopwatchReseted) {
                this.resumeStartedTime = (this.startTime = new Date())
                this.isStopwatchReseted = false
                this.studyRecord.push(new Info("begin", new Date(), 0))
            } else if(ask) {
                let ans = prompt("타이머를 중지한 동안 무엇을 하셨나요?")
                this.studyRecord.push(new Info("resume", new Date(), new Date() - this.pauseStartedTime, ans))
                // this.pausedTime += new Date() - this.pauseStartedTime
            } else {
                this.studyRecord.push(new Info("resume", new Date(), new Date() - this.pauseStartedTime, "스톱워치 이탈"))
            }
            this.resumeStartedTime = new Date()
            this.stopwatch = setInterval(()=>{
                this.updateTime()
            }, 1000/50)
        }
        this.isStopwatchWorking = !this.isStopwatchWorking
    }

    handleVisibilityChange() {
        if(document.hidden) {
            if(this.isStopwatchWorking) {
                this.toggleStopwatch()
            }
        } else {
            if(!this.isStopwatchWorking) {
                this.toggleStopwatch()
            }
        }
    }
}

/*
function debug() {
    console.log(stopwatchController.timeIndicator)
}
*/

let stopwatchController = new StopwatchController()

window.customElements.define('icon-tag', Icon)
// stopwatchController.initializeStopwatch()
window.addEventListener('load', ()=> {stopwatchController.initializeStopwatch();})
// setInterval(()=>{console.log(stopwatchController)}, 100)
window.addEventListener("visibilitychange", ()=>{stopwatchController.handleVisibilityChange()}, false)