(function initRouteMap() {
  const mount = document.getElementById("routeLottie");
  if (!mount || !window.lottie) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const anim = lottie.loadAnimation({
    container: mount,
    renderer: "svg",
    loop: !reduce,
    autoplay: !reduce,
    path: "assets/pune-gwalior.json",
  });

  if (reduce) {
    anim.addEventListener("DOMLoaded", () => anim.goToAndStop(anim.totalFrames - 1, true));
  }
})();
