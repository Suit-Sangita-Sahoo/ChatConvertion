"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const errorBox =
        document.getElementById("loginError");


    if (!form) {
        console.error("loginForm not found.");
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            errorBox.textContent = "";


            if (!email || !password) {

                errorBox.textContent =
                    "Enter email and password.";

                return;
            }


            console.log(
                "Sending login:",
                email
            );


            try {

                const response =
                    await fetch(
                        "/api/auth/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Login response:",
                    data
                );


                // =================================
                // LOGIN FAILED
                // =================================

                if (!response.ok) {

                    errorBox.textContent =
                        data.message ||
                        "Login failed.";

                    return;
                }


                // =================================
                // USER RECEIVED
                // =================================

                if (!data.user) {

                    errorBox.textContent =
                        "Server did not return user details.";

                    return;
                }


                console.log(
                    "Logged-in user:",
                    data.user
                );


                // =================================
                // SAVE TOKEN
                // =================================

                localStorage.setItem(
                    "token",
                    data.token
                );


                // =================================
                // SAVE USER
                // =================================

                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(data.user)
                );


                // =================================
                // SAVE USER ID
                // =================================

                localStorage.setItem(
                    "currentUserId",
                    data.user.id
                );


                console.log(
                    "CURRENT USER ID =",
                    data.user.id
                );


                // =================================
                // GO TO CHAT
                // =================================

                window.location.href =
                    "/index.html";

            }
            catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                errorBox.textContent =
                    "Cannot connect to server.";

            }

        }
    );

});