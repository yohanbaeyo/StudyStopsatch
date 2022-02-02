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
        this.pausedTime = 0;
        this.pauseStartedTime = null;
        this.stopwatch = null;
        this.startTime = null;
        this.studyRecord = [];
        this.resumeStartedTime = null;
    }

    initializeStopwatch() {
        this.isStopwatchReseted = true
        this.startTime = new Date()
        this.pausedTime = 0
        this.resumeStartedTime = null
        this.isStopwatchWorking = false;
        this.timeIndicator = document.querySelector("#time-indicator")
        // console.log(this.startTime)
        // setInterval(()=>{console.log(this.timeIndicator)}, 1000)
    }

    extractCSV() {
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

        let ans = confirm("공부를 이어하되 지금까지의 기록을 지우고 덮어쓰시겠습니까?")
        if(ans) {
            this.studyRecord = []
        }
    }

    addRecord() {
        console.log("addRecord")

        let ans = prompt("어떤 이유로 기록하시겠습니까?")
        this.studyRecord.push(new Info("record", new Date(), new Date() - this.resumeStartedTime, ans))
        this.resumeStartedTime = new Date()
        console.log(this.studyRecord)
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
        this.updateTime()

        let ans = confirm("미리 공부 기록을 백업해둘까요?")
        if(ans) {
            this.extractCSV()
        }
        this.studyRecord = []

        document.querySelectorAll('.change-when-paused').forEach((elem, _) => {
                elem.classList.remove("pausing")
            }
        )
    }


    updateTime() {
        // console.log(this.pausedTime)
        let deltaTime = (new Date() - this.startTime - this.pausedTime)
        let seconds = Math.floor(deltaTime / 1000)
        let hour = Math.floor((seconds/ 3600))
        let min = Math.floor((seconds % 3600) / 60)
        let deciseconds = Math.floor((deltaTime - seconds * 1000) / 100)
        seconds %= 60
        // let timeString = "" + (time/3600/1000) + ":" + (time/3600)
        this.timeIndicator.textContent = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${deciseconds}`
    }

    toggleStopwatch(event) {
        // console.log(this.isStopwatchWorking)
        // console.log(this.timeIndicator)
        // console.log(this.startTime)
        // event.target.childNodes[0].childNodes[0].textContent = "pause"
        if(this.isStopwatchWorking) {
            clearInterval(this.stopwatch)
            setTimeout(()=> {
                let ans = prompt("왜 타이머를 중지하나요?", "")
                console.log(ans)
                this.pauseStartedTime = new Date()
                this.studyRecord.push(new Info("pause", this.pauseStartedTime, this.pauseStartedTime - this.resumeStartedTime, ans))
            }, 400)
            document.querySelector("#stop-pause").children[0].setAttribute("type", "play_arrow")
            document.querySelector("#record-download").children[0].setAttribute("type", "download")
            document.querySelectorAll('.change-when-paused').forEach((elem, _) => {
                elem.classList.add("pausing")
                }
            )
        } else {
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
            } else {
                this.resumeStartedTime = new Date()
                this.pausedTime += new Date() - this.pauseStartedTime
                let ans = prompt("타이머를 중지한 동안 무엇을 하셨나요?", "")
                this.studyRecord.push(new Info("resume", new Date(), new Date() - this.pauseStartedTime, ans))
            }
            this.stopwatch = setInterval(()=>{
                this.updateTime()
            }, 1000/50)
        }
        this.isStopwatchWorking = !this.isStopwatchWorking
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
window.addEventListener('load', ()=> {stopwatchController.initializeStopwatch(); console.log(stopwatchController)})
// setInterval(()=>{console.log(stopwatchController)}, 100)

