// Initial setup
const circles = document.querySelectorAll(".circle");
const colors = [
  "#a23fff", "#a13eff", "#a039ff", "#9d33ff", "#992aff", "#9420fe", "#8f14fe",
  "#8a06fe", "#8302f4", "#7c02e4", "#7402d4", "#6c02c4", "#6502b4", "#5d02a4",
  "#550296", "#4e0288", "#47027c", "#420271", "#3d0268", "#390262", "#37025d", "#36025c"
];
let mouseX = 0;
let mouseY = 0;

// Initialize circle properties and colors
circles.forEach((circle, index) => {
  circle.style.backgroundColor = colors[index % colors.length];
  circle.setAttribute('data-scale', (circles.length - index) / circles.length);
});

// Update mouse coordinates on mouse move
window.addEventListener("mousemove", function (e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Function to animate circles
function animateCircles() {
  circles.forEach((circle, index) => {
    // Get circle scale from data attribute
    const scale = parseFloat(circle.getAttribute('data-scale'));

    // Update circle position
    circle.style.left = mouseX - 12 + "px";
    circle.style.top = mouseY - 12 + "px";

    // Apply scale to circle size
    circle.style.transform = `scale(${scale})`;

    // Calculate next position with trailing effect
    const nextCircle = circles[(index + 1) % circles.length];
    mouseX += (nextCircle.offsetLeft - mouseX) * 0.3;
    mouseY += (nextCircle.offsetTop - mouseY) * 0.3;
  });

  // Request next animation frame
  requestAnimationFrame(animateCircles);
}

// Start animation
animateCircles();
