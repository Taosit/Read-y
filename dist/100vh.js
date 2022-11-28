const vh = window.innerHeight * 0.01;

document.documentElement.style.setProperty("--vh", vh + "px");

function calculateVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", vh + "px");
}

calculateVh();

window.addEventListener("resize", calculateVh);

window.addEventListener("orientationchange", calculateVh);