const coords = { x: 0, y: 0 };
const circles = document.querySelectorAll(".circle");

const colors = [
  "#a23fff",
  "#a13eff",
  "#a039ff",
  "#9d33ff",
  "#992aff",
  "#9420fe",
  "#8f14fe",
  "#8a06fe",
  "#8302f4",
  "#7c02e4",
  "#7402d4",
  "#6c02c4",
  "#6502b4",
  "#5d02a4",
  "#550296",
  "#4e0288",
  "#47027c",
  "#420271",
  "#3d0268",
  "#390262",
  "#37025d",
  "#36025c",
];
circles.forEach(function (circle, index) {
  circle.x = 0;
  circle.y = 0;
  circle.style.backgroundColor = colors[index % colors.length];
});

window.addEventListener("mousemove", function (e) {
  coords.x = e.clientX;
  coords.y = e.clientY;
});

function animateCircles() {
  let x = coords.x;
  let y = coords.y;

  circles.forEach(function (circle, index) {
    circle.style.left = x - 12 + "px";
    circle.style.top = y - 12 + "px";

    circle.style.scale = (circles.length - index) / circles.length;

    circle.x = x;
    circle.y = y;

    const nextCircle = circles[index + 1] || circles[0];
    x += (nextCircle.x - x) * 0.3;
    y += (nextCircle.y - y) * 0.3;
  });

  requestAnimationFrame(animateCircles);
}

animateCircles();
