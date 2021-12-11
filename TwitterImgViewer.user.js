// ==UserScript==
// @name         TwitterImgViewer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://twitter.com/*
// @grant        none
// ==/UserScript==

(function() {

    function createImgViewer() {
        var html = `
        <div id='divViewer'
            style='
            position: fixed;
            inset: 0;
            margin: auto;
            height: min-content;
            width: min-content;
            text-align:center;
            background-color:rgba(0,0,0,0.3);'>

            <table style='margin:0.5vh auto 0 auto;'>
                <tr>
                    <td style='padding:0;width:3em;text-align:center;'><button id='btnPrev' style='width:2em;height:100%;'><br>《<br><br></button></td>
                    <td style='padding:0'width:auto;text-align:center;'><img id='imgMain' style='height: 95vh;'></td>
                    <td style='padding:0;width:3em;text-align:center;'><button id='btnNext' style='width:2em;height:100%;'><br>》<br><br></button></td>
                </tr>
                <tr><td colspan="3" id="lblPage" style="font-size:8pt; font-weight:bold;"></td></tr>
            </table>

        </div>`;
        document.body.insertAdjacentHTML("beforeend", html);

        var imgList = {
            list: [],
            currImg: "",
            intervalId: 0,
            onPageUpdate: ()=>{},
            startScanning() {
                var scanFunc = () => {
                    var oldLength = this.list.length;
                    var nowList = [...document.querySelectorAll("img[src*='https://pbs.twimg.com/media/']")]
                                  .filter(el=> el.closest("a[href]") != null)
                                  .map( el => ({img: el.src.replace(/&name.*$/, ''), href: el.closest("a[href]").href}) );
                    nowList.forEach(nowItem => {
                        if (this.list.some(item => item.href == nowItem.href) == false) {
                            this.list.push(nowItem);
                            (document.createElement('img')).src = nowItem.img; // プリロード
                        }
                    });
                    this.list = this.list.sort((i1, i2) => i1.href > i2.href);
                    if (this.list.length > 0 && this.currImg == "") {
                        this.currImg = this.list[0].img;
                    }
                    if (this.list.length != oldLength) {
                        this.onPageUpdate(this.getPageInfo());
                    }
                };
                scanFunc();
                this.intervalId = setInterval(scanFunc, 300);
            },
            stopScanning() {
                clearInterval(this.intervalId);
            },
            move(plus) {
                if (this.currImg == "") { return; }
                var idx = this.list.findIndex(item => item.img == this.currImg);
                idx += plus;
                if (idx < 0) { idx = 0; }
                if (idx > this.list.length - 1) { idx = this.list.length - 1; }
                this.currImg = this.list[idx].img;
                this.onPageUpdate(this.getPageInfo());
            },
            getPageInfo() {
                if (this.currImg == "") { return ""; }
                var idx = this.list.findIndex(item => item.img == this.currImg);
                return `( ${idx+1} / ${this.list.length} )`;
            },
        };

        imgList.startScanning();
        imgList.onPageUpdate = (pageInfo) => { document.querySelector("#lblPage").innerText = pageInfo };

        var showPage = function(plus) {
            imgList.move(plus);
            document.querySelector("#imgMain").src = imgList.currImg;
        };

        showPage(0);
        document.querySelector("#btnPrev").addEventListener("click", () => showPage(-9999) );
        document.querySelector("#btnNext").addEventListener("click", () => showPage(+9999) );
        document.body.addEventListener("keydown", (ev) => {
            if (ev.key == "Escape") { imgList.stopScanning(); document.querySelector("#divViewer").remove(); }
            if (ev.key == "ArrowUp" || ev.key == "ArrowLeft") { showPage(ev.ctrlKey ? -9999 : -1); }
            if (ev.key == "ArrowDown" || ev.key == "ArrowRight") { showPage(ev.ctrlKey ? +9999 : +1); }
        });
    }

    setTimeout(() => {
        var buttonParent = document.querySelector("a[aria-label='ツイートする']").parentElement;
        buttonParent.insertAdjacentHTML("beforeend", "<button id='btnViewer' style='margin-top:2em;padding:5px;'>Viewer</button>");
        document.querySelector("#btnViewer").addEventListener("click", createImgViewer);
    }, 1000);

})();