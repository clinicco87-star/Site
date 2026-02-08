const form = document.getElementById("resetForm");
const messageEl = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  messageEl.textContent = "";
  messageEl.className = "message";

  if (password.length < 6) {
    messageEl.textContent = "Password must be at least 6 characters.";
    messageEl.classList.add("error");
    return;
  }

  if (password !== confirmPassword) {
    messageEl.textContent = "Passwords do not match.";
    messageEl.classList.add("error");
    return;
  }

  // 🔥 Reuse existing client
  const { error } = await supabaseClient.auth.updateUser({
    password: password
  });

  if (error) {
    messageEl.textContent = error.message;
    messageEl.classList.add("error");
  } else {
    messageEl.textContent = "✅ Password updated successfully. Redirecting to login...";
    messageEl.classList.add("success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  }
});
