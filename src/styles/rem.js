//--------------
//designWidth:设计稿的实际宽度值，需要根据实际设置
//maxWidth:制作稿的最大宽度值，需要根据实际设置
//minWidth:制作稿最小宽度值,需根据实际设置
//这段js的最后面有两个参数记得要设置，一个为设计稿实际宽度，一个为制作稿最大宽度，例如设计稿为750，最大宽度为750，则为(750,750)

//rem自适应宽度变化方法

(function (designWidth, maxWidth, minWidth) {
	var doc = document,
		win = window;
	var docEl = doc.documentElement;
	var tid;
	var rootItem;

	function refreshRem() {
		let rem = 16
		console.log(document.documentElement.clientWidth, designWidth, maxWidth, minWidth)
		if (document.documentElement.clientWidth > minWidth) {
			var width = docEl.getBoundingClientRect().width;
			maxWidth = maxWidth || 540;
			width > maxWidth && (width = maxWidth);
			rem = width * 16 / designWidth;
		} else {
			rem = minWidth * 16 / designWidth;
			// Vue.prototype.$fontSize = rem
			console.log("窗口尺寸过小，样式静止")
		}
		rootItem = document.getElementById('rootsize') || document.createElement("style");
		if (!document.getElementById('rootsize')) {
			document.getElementsByTagName("head")[0].appendChild(rootItem);
			rootItem.id = 'rootsize';
		}
		if (rootItem.styleSheet) {
			rootItem.styleSheet.disabled || (rootItem.styleSheet.cssText = remStyle)
		} else {
			try {
				rootItem.innerHTML = 'html{font-size:' + rem + 'px;}';
			} catch (f) {
				rootItem.innerText = 'html{font-size:' + rem + 'px;}';
			}
		}
	}
	// 改变窗口大小时重新设置 rem
	window.addEventListener("resize", refreshRem)
	refreshRem();
	win.addEventListener("resize", function () {
		clearTimeout(tid); //防止执行两次 tid = setTimeout(refreshRem, 300);
	}, false);
	win.addEventListener("pageshow", function (e) {
		if (e.persisted) { // 浏览器后退的时候重新计算 clearTimeout(tid);
			tid = setTimeout(refreshRem, 300);
		}
	}, false);
	if (doc.readyState === "complete") {
		doc.body.style.fontSize = "16px";
	} else {
		doc.addEventListener("DOMContentLoaded", function (e) {
			doc.body.style.fontSize = "16px";
		}, false);
	}
})(1920, 4480, 1360);
