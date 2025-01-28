document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      if (data.role === "admin") {
        window.location.href = "/admin/dashboard"; // Redirect to admin page
      } else if (data.role === "customer") {
        window.location.href = "/customer/profile"; // Redirect to customer page
      }
    } else {
      alert(data.message); // Display error message
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
// grab the form element and add an event listener to it. 
document.getElementById("register_form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm_password").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful! Please log in.");
      window.location.href = "/login"; // Redirect to login page
    } else {
      alert(data.message); // Display error message
    }
  } catch (error) {
    console.error("Error:", error);
  }
});