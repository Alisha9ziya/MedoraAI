$(document).ready(function () {

    console.log("MediVault JavaScript loaded successfully");


    // =========================
    // THEME
    // =========================

    const savedTheme = localStorage.getItem("medivault-theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-theme");

        $("#themeIcon")
            .removeClass("fa-moon")
            .addClass("fa-sun");
    }


    $("#themeToggle").on("click", function () {

        document.body.classList.toggle("light-theme");

        const isLight =
            document.body.classList.contains("light-theme");

        localStorage.setItem(
            "medivault-theme",
            isLight ? "light" : "dark"
        );

        $("#themeIcon")
            .toggleClass("fa-moon", !isLight)
            .toggleClass("fa-sun", isLight);

    });


    // =========================
    // NEW CHAT
    // =========================

    $("#newChat").on("click", function () {

        $("#messageFormeight").empty();

        $("#welcomeScreen").show();

        $("#text").val("").focus();

    });


    // =========================
    // SUGGESTION CARDS
    // =========================

    $(".suggestion-card").on("click", function () {

        const prompt = $(this).data("prompt");

        $("#welcomeScreen").hide();

        $("#text").val(prompt).focus();

    });


    // =========================
    // SEND MESSAGE
    // =========================

    $("#messageArea").on("submit", function (event) {

        event.preventDefault();

        const rawText = $("#text").val().trim();

        if (!rawText) {
            return;
        }


        $("#welcomeScreen").hide();


        const now = new Date();

        const strTime = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });


        // USER MESSAGE

        const userHtml = `
            <div class="message-row user-row">

                <div class="message-content user-message">

                    <div class="message-label">
                        You
                    </div>

                    <div class="message-text">
                        ${escapeHtml(rawText)}
                    </div>

                    <div class="message-time">
                        ${strTime}
                    </div>

                </div>

            </div>
        `;

        $("#messageFormeight").append(userHtml);

        $("#text").val("");

        scrollToBottom();


        // =========================
        // LOADING
        // =========================

        const loadingId = "loading-" + Date.now();

        const loadingHtml = `
            <div
                class="message-row bot-row"
                id="${loadingId}"
            >

                <div class="bot-avatar">
                    <i class="fas fa-plus"></i>
                </div>


                <div class="message-content bot-message">

                    <div class="message-label">
                        MediVault AI
                    </div>


                    <div class="thinking">

                        <span></span>
                        <span></span>
                        <span></span>

                    </div>


                    <div class="thinking-text">
                        Searching medical knowledge base...
                    </div>

                </div>

            </div>
        `;

        $("#messageFormeight").append(loadingHtml);

        scrollToBottom();


        // =========================
        // SEND TO FLASK BACKEND
        // =========================

        $.ajax({

            url: "/get",

            type: "POST",

            data: {
                msg: rawText
            },


            success: function (data) {

                $("#" + loadingId).remove();


                if (!data.success) {

                    showError(
                        data.error ||
                        "I couldn't generate a response."
                    );

                    return;

                }


                const botHtml = `

                    <div class="message-row bot-row">

                        <div class="bot-avatar">
                            <i class="fas fa-plus"></i>
                        </div>


                        <div class="message-content bot-message">

                            <div class="message-label">
                                MediVault AI
                            </div>


                            <div class="message-text">
                                ${formatResponse(data.answer)}
                            </div>


                            <div class="source-badge">

                                <i class="fas fa-book-medical"></i>

                                ${data.source_count || 0}
                                Medical Sources Retrieved

                            </div>


                            <div class="message-time">
                                ${strTime}
                            </div>

                        </div>

                    </div>

                `;


                $("#messageFormeight").append(botHtml);

                scrollToBottom();

            },


            error: function (xhr) {

                $("#" + loadingId).remove();


                let errorMessage =
                    "I couldn't generate a response right now.";


                if (
                    xhr.responseJSON &&
                    xhr.responseJSON.error
                ) {

                    errorMessage =
                        xhr.responseJSON.error;

                }

                else if (xhr.status === 429) {

                    errorMessage =
                        "The AI service has reached its current usage limit.";

                }


                showError(errorMessage);

            }

        });

    });


    // =========================
    // ENTER TO SEND
    // =========================

    $("#text").on("keydown", function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            $("#messageArea").submit();

        }

    });


    // =========================
    // MOBILE MENU
    // =========================

    $("#mobileMenu").on("click", function () {

        $(".sidebar").toggleClass("sidebar-open");

    });


    // =========================
    // SHOW ERROR
    // =========================

    function showError(errorMessage) {

        const errorHtml = `

            <div class="message-row bot-row">

                <div class="bot-avatar error-avatar">

                    <i class="fas fa-exclamation"></i>

                </div>


                <div class="message-content bot-message error-message">

                    <div class="message-label">
                        MediVault AI
                    </div>


                    <div class="message-text">

                        ${escapeHtml(errorMessage)}

                    </div>

                </div>

            </div>

        `;


        $("#messageFormeight").append(errorHtml);

        scrollToBottom();

    }


    // =========================
    // SCROLL
    // =========================

    function scrollToBottom() {

        const container = $("#messageFormeight");

        container.stop().animate({

            scrollTop:
                container[0].scrollHeight

        }, 300);

    }


    // =========================
    // ESCAPE HTML
    // =========================

    function escapeHtml(text) {

        return $("<div>")
            .text(text)
            .html();

    }


    // =========================
    // FORMAT RESPONSE
    // =========================

    function formatResponse(data) {

        if (typeof data !== "string") {

            return escapeHtml(
                JSON.stringify(data)
            );

        }

        return escapeHtml(data)

            .replace(
                /\n\n/g,
                "<br><br>"
            )

            .replace(
                /\n/g,
                "<br>"
            );

    }

});