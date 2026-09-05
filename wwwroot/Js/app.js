"use strict";

// ==========================================================
// REAL-TIME CHAT APPLICATION
// ==========================================================

console.log("======================================");
console.log("Real-Time Chat app.js loaded");
console.log("======================================");

let currentUser = null;
let currentUserId = null;

let selectedUser = null;
let selectedUserId = null;

let connection = null;

let typingTimer = null;
let userRefreshTimer = null;
const displayedMessageIds = new Set();


// ==========================================================
// HELPER FUNCTIONS
// ==========================================================


// ----------------------------------------------------------
// Get User ID
// ----------------------------------------------------------

function getUserId(user) {

    if (!user) {
        return null;
    }

    const id =
        user.id ??
        user.Id ??
        user.userId ??
        user.UserId;

    const numberId = Number(id);

    if (
        Number.isNaN(numberId) ||
        numberId <= 0
    ) {
        return null;
    }

    return numberId;
}


// ----------------------------------------------------------
// Get Username
// ----------------------------------------------------------

function getUsername(user) {

    if (!user) {
        return "Unknown User";
    }

    const name =
        user.username ??
        user.Username ??
        user.name ??
        user.Name ??
        user.fullName ??
        user.FullName ??
        user.email ??
        user.Email ??
        "Unknown User";

    return String(name);
}


// ----------------------------------------------------------
// Get Email
// ----------------------------------------------------------

function getUserEmail(user) {

    if (!user) {
        return "";
    }

    return String(
        user.email ??
        user.Email ??
        ""
    );
}


// ----------------------------------------------------------
// Get Profile Image
// ----------------------------------------------------------

function getProfileImage(user) {

    if (!user) {
        return "";
    }

    return (
        user.profileImage ??
        user.ProfileImage ??
        user.profileImageUrl ??
        user.ProfileImageUrl ??
        user.avatar ??
        user.Avatar ??
        ""
    );
}


// ----------------------------------------------------------
// Escape HTML
// ----------------------------------------------------------

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


// ----------------------------------------------------------
// Message ID
// ----------------------------------------------------------

function getMessageId(message) {

    if (!message) {
        return null;
    }

    const id =
        message.id ??
        message.Id;

    if (
        id === undefined ||
        id === null
    ) {
        return null;
    }

    return String(id);
}


// ----------------------------------------------------------
// Message Sender ID
// ----------------------------------------------------------

function getMessageSenderId(message) {

    if (!message) {
        return null;
    }

    const id =
        message.senderId ??
        message.SenderId;

    const numberId =
        Number(id);

    if (Number.isNaN(numberId)) {
        return null;
    }

    return numberId;
}


// ----------------------------------------------------------
// Message Receiver ID
// ----------------------------------------------------------

function getMessageReceiverId(message) {

    if (!message) {
        return null;
    }

    const id =
        message.receiverId ??
        message.ReceiverId;

    const numberId =
        Number(id);

    if (Number.isNaN(numberId)) {
        return null;
    }

    return numberId;
}


// ----------------------------------------------------------
// Message Content
// ----------------------------------------------------------

function getMessageText(message) {

    if (!message) {
        return "";
    }

    return String(
        message.content ??
        message.Content ??
        message.message ??
        message.Message ??
        message.text ??
        message.Text ??
        ""
    );
}


// ----------------------------------------------------------
// Message Type
// ----------------------------------------------------------

function getMessageType(message) {

    if (!message) {
        return "Text";
    }

    return String(
        message.messageType ??
        message.MessageType ??
        "Text"
    );
}


// ----------------------------------------------------------
// Media URL
// ----------------------------------------------------------

function getMediaUrl(message) {

    if (!message) {
        return "";
    }

    return String(
        message.mediaUrl ??
        message.MediaUrl ??
        ""
    );
}


// ----------------------------------------------------------
// Message Date
// ----------------------------------------------------------

function getMessageDate(message) {

    if (!message) {
        return new Date().toISOString();
    }

    return (
        message.createdAt ??
        message.CreatedAt ??
        new Date().toISOString()
    );
}


// ----------------------------------------------------------
// Format Message Time
// ----------------------------------------------------------

function formatMessageTime(createdAt) {

    if (!createdAt) {
        return "";
    }

    const date =
        new Date(createdAt);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================================
// CURRENT USER
// ==========================================================


// ----------------------------------------------------------
// Get Current User From LocalStorage
// ----------------------------------------------------------

function getCurrentUser() {

    try {

        let storedUser =
            localStorage.getItem("user");

        if (storedUser) {

            const user =
                JSON.parse(storedUser);

            const id =
                getUserId(user);

            if (id) {

                currentUser =
                    user;

                currentUserId =
                    id;

                return true;
            }
        }


        storedUser =
            localStorage.getItem("currentUser");

        if (storedUser) {

            const user =
                JSON.parse(storedUser);

            const id =
                getUserId(user);

            if (id) {

                currentUser =
                    user;

                currentUserId =
                    id;

                return true;
            }
        }


        storedUser =
            localStorage.getItem("authUser");

        if (storedUser) {

            const user =
                JSON.parse(storedUser);

            const id =
                getUserId(user);

            if (id) {

                currentUser =
                    user;

                currentUserId =
                    id;

                return true;
            }
        }


        const savedId =
            localStorage.getItem(
                "currentUserId"
            );

        if (savedId) {

            const id =
                Number(savedId);

            if (
                !Number.isNaN(id) &&
                id > 0
            ) {

                currentUserId =
                    id;

                currentUser = {
                    id: id
                };

                return true;
            }
        }


        console.warn(
            "No logged-in user found."
        );

        return false;

    }
    catch (error) {

        console.error(
            "Error getting current user:",
            error
        );

        return false;
    }
}


// ----------------------------------------------------------
// Save Current User
// ----------------------------------------------------------

function saveCurrentUser(user) {

    const id =
        getUserId(user);

    if (!id) {

        console.error(
            "Invalid user:",
            user
        );

        return;
    }

    currentUser =
        user;

    currentUserId =
        id;

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );

    localStorage.setItem(
        "currentUserId",
        String(id)
    );
}


// ----------------------------------------------------------
// Update Current User UI
// ----------------------------------------------------------

function updateCurrentUserUI() {

    if (!currentUser) {
        return;
    }

    const username =
        getUsername(currentUser);

    const email =
        getUserEmail(currentUser);

    const profileImage =
        getProfileImage(currentUser);


    // Current user avatar
    const avatar =
        document.getElementById(
            "currentUserAvatar"
        );

    if (avatar) {

        if (profileImage) {

            avatar.innerHTML = `
                <img
                    src="${escapeHtml(profileImage)}"
                    alt="${escapeHtml(username)}"
                >
            `;

        }
        else {

            avatar.textContent =
                username
                    .charAt(0)
                    .toUpperCase();
        }
    }


    // Current user name
    const nameElement =
        document.getElementById(
            "currentUserName"
        );

    if (nameElement) {

        nameElement.textContent =
            username;
    }


    // Current user email
    const emailElement =
        document.getElementById(
            "currentUserEmail"
        );

    if (emailElement) {

        emailElement.textContent =
            email;
    }


    // Left chat title
    const sangitaTitle =
        document.getElementById(
            "sangitaTitle"
        );

    if (sangitaTitle) {

        sangitaTitle.textContent =
            `👤 ${username}`;
    }


    // Left chat user ID
    const sangitaUserId =
        document.getElementById(
            "sangitaUserId"
        );

    if (sangitaUserId) {

        sangitaUserId.textContent =
            `ID: ${currentUserId}`;
    }
}


// ==========================================================
// REFRESH CURRENT USER DETAILS
// ==========================================================

async function refreshCurrentUserDetails() {

    if (!currentUserId) {
        return;
    }

    try {

        const response =
            await fetch("/api/users");

        if (!response.ok) {
            return;
        }

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {
            return;
        }

        const users =
            await response.json();

        if (!Array.isArray(users)) {
            return;
        }

        const latestUser =
            users.find(
                user =>
                    getUserId(user) ===
                    Number(currentUserId)
            );

        if (!latestUser) {
            return;
        }

        saveCurrentUser({
            ...currentUser,
            ...latestUser
        });

        updateCurrentUserUI();

    }
    catch (error) {

        console.warn(
            "Could not refresh current user:",
            error
        );
    }
}


// ==========================================================
// SIGNALR CONNECTION
// ==========================================================

async function startConnection() {

    if (
        typeof signalR ===
        "undefined"
    ) {

        console.error(
            "SignalR library is not loaded."
        );

        return;
    }


    const token =
        localStorage.getItem("token");


    connection =
        new signalR.HubConnectionBuilder()
            .withUrl(
                "/chatHub",
                {
                    accessTokenFactory:
                        () => token || ""
                }
            )
            .withAutomaticReconnect()
            .configureLogging(
                signalR.LogLevel.Information
            )
            .build();


    // ======================================================
    // RECEIVE MESSAGE
    // ======================================================

    connection.on(
        "ReceiveMessage",
        function (message) {

            console.log(
                "Received message:",
                message
            );

            if (!message) {
                return;
            }

            if (!currentUserId) {
                return;
            }

            if (!selectedUserId) {
                return;
            }


            const senderId =
                getMessageSenderId(
                    message
                );

            const receiverId =
                getMessageReceiverId(
                    message
                );


            if (
                !senderId ||
                !receiverId
            ) {
                return;
            }


            // Check conversation
            const validConversation =
                (
                    senderId ===
                    Number(currentUserId) &&
                    receiverId ===
                    Number(selectedUserId)
                )
                ||
                (
                    senderId ===
                    Number(selectedUserId) &&
                    receiverId ===
                    Number(currentUserId)
                );


            if (!validConversation) {
                return;
            }


            // Current user perspective
            const myMessages =
                document.getElementById(
                    "sangitaMessages"
                );

            if (myMessages) {

                addMessageToContainer(
                    myMessages,
                    message,
                    currentUserId
                );
            }


            // Selected user perspective
            const selectedMessages =
                document.getElementById(
                    "selectedMessages"
                );

            if (selectedMessages) {

                addMessageToContainer(
                    selectedMessages,
                    message,
                    selectedUserId
                );
            }
        }
    );


    // ======================================================
    // TYPING
    // ======================================================

    connection.on(
        "UserTyping",
        function (senderId) {

            senderId =
                Number(senderId);


            if (
                !selectedUserId ||
                senderId !==
                Number(selectedUserId)
            ) {
                return;
            }


            const typing =
                document.getElementById(
                    "typing"
                );

            if (!typing) {
                return;
            }


            const username =
                getUsername(
                    selectedUser
                );


            typing.textContent =
                `${username} is typing...`;


            clearTimeout(
                typingTimer
            );


            typingTimer =
                setTimeout(
                    function () {

                        typing.textContent =
                            "";

                    },
                    2000
                );
        }
    );


    // ======================================================
    // RECONNECTED
    // ======================================================

    connection.onreconnected(
        async function () {

            console.log(
                "SignalR reconnected."
            );

            if (selectedUserId) {

                await loadMessages();
            }
        }
    );


    // ======================================================
    // CONNECTION CLOSED
    // ======================================================

    connection.onclose(
        function (error) {

            console.log(
                "SignalR connection closed.",
                error
            );
        }
    );


    // ======================================================
    // START CONNECTION
    // ======================================================

    try {

        await connection.start();

        console.log(
            "SignalR connected successfully."
        );

    }
    catch (error) {

        console.error(
            "SignalR connection failed:",
            error
        );
    }
}


// ==========================================================
// USERS
// ==========================================================


// ----------------------------------------------------------
// Load Users
// ----------------------------------------------------------

async function loadUsers(
    search = ""
) {

    try {

        let url =
            "/api/users";


        if (search.trim() !== "") {

            url =
                `/api/users?search=${encodeURIComponent(
                    search
                )}`;
        }


        const response =
            await fetch(url);


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Users API error:",
                errorText
            );

            throw new Error(
                `Users API returned ${response.status}`
            );
        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            throw new Error(
                "Users API did not return JSON."
            );
        }


        const users =
            await response.json();


        if (!Array.isArray(users)) {

            console.error(
                "Users API did not return array:",
                users
            );

            return;
        }


        const list =
            document.getElementById(
                "usersList"
            );


        if (!list) {

            console.error(
                "usersList not found."
            );

            return;
        }


        list.innerHTML = "";


        // ==================================================
        // DISPLAY USERS
        // ==================================================

        users.forEach(
            function (user) {

                const userId =
                    getUserId(user);


                if (!userId) {
                    return;
                }


                // Do not display current user
                if (
                    userId ===
                    Number(currentUserId)
                ) {
                    return;
                }


                const username =
                    getUsername(user);

                const profileImage =
                    getProfileImage(user);


                // ==================================================
                // IMPORTANT:
                // ONLY SELECTED USER IS ONLINE
                // EVERY OTHER USER IS OFFLINE
                // ==================================================

                const isSelected =
                    selectedUserId !== null &&
                    Number(userId) ===
                    Number(selectedUserId);


                const online =
                    isSelected;


                // ==================================================
                // CREATE USER ELEMENT
                // ==================================================

                const userElement =
                    document.createElement(
                        "div"
                    );


                userElement.className =
                    "user";


                if (isSelected) {

                    userElement.classList.add(
                        "selected-user"
                    );
                }


                // ==================================================
                // AVATAR
                // ==================================================

                let avatarHTML = "";


                if (profileImage) {

                    avatarHTML = `
                        <div class="user-avatar">

                            <img
                                src="${escapeHtml(profileImage)}"
                                alt="${escapeHtml(username)}"
                            >

                        </div>
                    `;

                }
                else {

                    avatarHTML = `
                        <div class="user-avatar">
                            ${escapeHtml(
                                username
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>
                    `;
                }


                // ==================================================
                // USER HTML
                // ==================================================

                userElement.innerHTML = `

                    ${avatarHTML}

                    <div class="user-info">

                        <h3>
                            ${escapeHtml(username)}
                        </h3>

                        <span class="user-status">

                            ${
                                online
                                    ? "🟢 Online"
                                    : "⚫ Offline"
                            }

                        </span>

                    </div>
                `;


                // ==================================================
                // USER CLICK
                // ==================================================

                userElement.addEventListener(
                    "click",
                    function () {

                        selectUser(user);

                    }
                );


                list.appendChild(
                    userElement
                );
            }
        );


        // ==================================================
        // NO USERS
        // ==================================================

        if (
            list.children.length ===
            0
        ) {

            list.innerHTML = `
                <div class="no-users">
                    No other users found.
                </div>
            `;
        }

    }
    catch (error) {

        console.error(
            "Could not load users:",
            error
        );


        const list =
            document.getElementById(
                "usersList"
            );


        if (list) {

            list.innerHTML = `
                <div class="no-users">
                    Unable to load users.
                </div>
            `;
        }
    }
}


// ==========================================================
// SELECT USER
// ==========================================================

async function selectUser(user) {

    const id =
        getUserId(user);


    if (!id) {

        console.error(
            "Invalid selected user:",
            user
        );

        return;
    }


    if (
        Number(id) ===
        Number(currentUserId)
    ) {
        return;
    }


    // ======================================================
    // SET SELECTED USER
    // ======================================================

    selectedUser =
        user;

    selectedUserId =
        id;


    const username =
        getUsername(user);


    console.log(
        "Selected user:",
        selectedUser
    );


    // ======================================================
    // CHAT HEADER
    // ======================================================

    const chatUserName =
        document.getElementById(
            "chatUserName"
        );

    if (chatUserName) {

        chatUserName.textContent =
            username;
    }


    // ======================================================
    // CHAT STATUS
    // ONLY SELECTED USER = ONLINE
    // ======================================================

    const chatStatus =
        document.getElementById(
            "chatStatus"
        );

    if (chatStatus) {

        chatStatus.innerHTML =
            `<span class="status-dot"></span> Online`;
    }


    // ======================================================
    // SELECTED USER BOX
    // ======================================================

    const selectedTitle =
        document.getElementById(
            "selectedUserTitle"
        );

    if (selectedTitle) {

        selectedTitle.textContent =
            `👤 ${username}`;
    }


    const selectedIdElement =
        document.getElementById(
            "selectedUserId"
        );

    if (selectedIdElement) {

        selectedIdElement.textContent =
            `ID: ${id}`;
    }


    // ======================================================
    // SELECTED USER INPUT
    // ======================================================

    const selectedInput =
        document.getElementById(
            "selectedUserInput"
        );

    if (selectedInput) {

        selectedInput.placeholder =
            `Message ${username}...`;
    }


    // ======================================================
    // CLEAR IMAGE PREVIEWS
    // ======================================================

    const preview1 =
        document.getElementById(
            "sangitaImagePreview"
        );

    if (preview1) {
        preview1.innerHTML = "";
    }


    const preview2 =
        document.getElementById(
            "selectedImagePreview"
        );

    if (preview2) {
        preview2.innerHTML = "";
    }


    const image1 =
        document.getElementById(
            "sangitaImage"
        );

    if (image1) {
        image1.value = "";
    }


    const image2 =
        document.getElementById(
            "selectedUserImage"
        );

    if (image2) {
        image2.value = "";
    }


    // ======================================================
    // REFRESH USER LIST
    // THIS MAKES ONLY SELECTED USER ONLINE
    // ======================================================

    const searchInput =
        document.getElementById(
            "searchUser"
        );

    const search =
        searchInput
            ? searchInput.value.trim()
            : "";


    await loadUsers(search);


    // ======================================================
    // LOAD MESSAGE HISTORY
    // ======================================================

    await loadMessages();
}


// ==========================================================
// MESSAGES
// ==========================================================


// ----------------------------------------------------------
// Load Messages
// ----------------------------------------------------------

async function loadMessages() {

    if (
        !currentUserId ||
        !selectedUserId
    ) {
        return;
    }


    const url =
        `/api/messages/${currentUserId}/${selectedUserId}`;


    console.log(
        "Loading messages:",
        url
    );


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Messages API error:",
                response.status,
                errorText
            );

            throw new Error(
                `Messages API returned ${response.status}`
            );
        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            throw new Error(
                "Messages API did not return JSON."
            );
        }


        const messages =
            await response.json();


        if (!Array.isArray(messages)) {

            console.error(
                "Messages API did not return array:",
                messages
            );

            return;
        }


        // Clear both boxes
        clearMessages(
            "sangitaMessages"
        );

        clearMessages(
            "selectedMessages"
        );


        // Clear duplicate tracking
        displayedMessageIds.clear();


        // No messages
        if (
            messages.length === 0
        ) {

            showEmptyMessage(
                "sangitaMessages",
                "No messages yet."
            );

            showEmptyMessage(
                "selectedMessages",
                "No messages yet."
            );

            return;
        }


        // Display messages
        messages.forEach(
            function (message) {

                const myContainer =
                    document.getElementById(
                        "sangitaMessages"
                    );

                const selectedContainer =
                    document.getElementById(
                        "selectedMessages"
                    );


                if (myContainer) {

                    addMessageToContainer(
                        myContainer,
                        message,
                        currentUserId
                    );
                }


                if (selectedContainer) {

                    addMessageToContainer(
                        selectedContainer,
                        message,
                        selectedUserId
                    );
                }
            }
        );

    }
    catch (error) {

        console.error(
            "Could not load messages:",
            error
        );


        showEmptyMessage(
            "sangitaMessages",
            "Unable to load messages."
        );


        showEmptyMessage(
            "selectedMessages",
            "Unable to load messages."
        );
    }
}


// ----------------------------------------------------------
// Add Message To Container
// ----------------------------------------------------------

function addMessageToContainer(
    container,
    message,
    perspectiveUserId
) {

    if (!container) {
        return;
    }


    const messageId =
        getMessageId(message);


    // Prevent duplicates
    if (messageId) {

        const uniqueId =
            `${container.id}_${messageId}`;


        if (
            displayedMessageIds.has(
                uniqueId
            )
        ) {
            return;
        }


        displayedMessageIds.add(
            uniqueId
        );
    }


    // Sender
    const senderId =
        getMessageSenderId(
            message
        );


    const isSent =
        Number(senderId) ===
        Number(perspectiveUserId);


    // Create message
    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        isSent
            ? "message sent"
            : "message received";


    // Message type
    const messageType =
        getMessageType(
            message
        ).toLowerCase();


    // Remove empty message
    const empty =
        container.querySelector(
            ".empty-chat"
        );


    if (empty) {
        empty.remove();
    }


    // ======================================================
    // IMAGE MESSAGE
    // ======================================================

    if (
        messageType === "image"
    ) {

        const mediaUrl =
            getMediaUrl(message);


        if (mediaUrl) {

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "chat-image";


            image.src =
                mediaUrl;


            image.alt =
                "Image message";


            image.loading =
                "lazy";


            image.addEventListener(
                "click",
                function () {

                    window.open(
                        mediaUrl,
                        "_blank"
                    );
                }
            );


            messageElement.appendChild(
                image
            );
        }

    }


    // ======================================================
    // TEXT MESSAGE
    // ======================================================

    else {

        const text =
            document.createElement(
                "div"
            );


        text.className =
            "message-text";


        text.textContent =
            getMessageText(
                message
            );


        messageElement.appendChild(
            text
        );
    }


    // ======================================================
    // MESSAGE TIME
    // ======================================================

    const time =
        document.createElement(
            "small"
        );


    time.className =
        "message-time";


    time.textContent =
        formatMessageTime(
            getMessageDate(
                message
            )
        );


    messageElement.appendChild(
        time
    );


    // Add message
    container.appendChild(
        messageElement
    );


    // Scroll bottom
    container.scrollTop =
        container.scrollHeight;
}


// ----------------------------------------------------------
// Clear Messages
// ----------------------------------------------------------

function clearMessages(
    containerId
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";
}


// ----------------------------------------------------------
// Show Empty Message
// ----------------------------------------------------------

function showEmptyMessage(
    containerId,
    text
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="empty-chat">
            <p>
                ${escapeHtml(text)}
            </p>
        </div>
    `;
}


// ==========================================================
// SEND TEXT MESSAGE
// ==========================================================

async function sendMessage(
    senderId,
    receiverId,
    inputId
) {

    senderId =
        Number(senderId);

    receiverId =
        Number(receiverId);


    if (!senderId) {

        alert(
            "Current user is not available. Please login again."
        );

        return;
    }


    if (!receiverId) {

        alert(
            "Please select a user first."
        );

        return;
    }


    if (
        senderId ===
        receiverId
    ) {

        alert(
            "You cannot send a message to yourself."
        );

        return;
    }


    const input =
        document.getElementById(
            inputId
        );


    if (!input) {

        console.error(
            "Input not found:",
            inputId
        );

        return;
    }


    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    if (
        !connection ||
        connection.state !==
        signalR.HubConnectionState.Connected
    ) {

        alert(
            "Chat connection is not ready."
        );

        return;
    }


    try {

        await connection.invoke(
            "SendMessage",
            senderId,
            receiverId,
            message
        );


        input.value = "";

        input.focus();


        console.log(
            "Text message sent:",
            message
        );

    }
    catch (error) {

        console.error(
            "Could not send text message:",
            error
        );

        alert(
            "Message could not be sent."
        );
    }
}


// ==========================================================
// IMAGE FUNCTIONS
// ==========================================================


// ----------------------------------------------------------
// Preview Image
// ----------------------------------------------------------

function previewImage(
    file,
    previewId
) {

    const preview =
        document.getElementById(
            previewId
        );


    if (!preview) {
        return;
    }


    preview.innerHTML = "";


    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            preview.innerHTML = `
                <img
                    src="${event.target.result}"
                    class="image-preview"
                    alt="Image preview"
                >
            `;
        };


    reader.readAsDataURL(file);
}


// ----------------------------------------------------------
// Upload Image
// ----------------------------------------------------------

async function uploadImage(file) {

    if (!file) {
        return null;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    // Validate type
    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        alert(
            "Only JPG, PNG and WEBP images are allowed."
        );

        return null;
    }


    // Validate size
    if (
        file.size >
        5 * 1024 * 1024
    ) {

        alert(
            "Image size must be less than 5 MB."
        );

        return null;
    }


    const formData =
        new FormData();


    formData.append(
        "image",
        file
    );


    try {

        const response =
            await fetch(
                "/api/messages/upload-image",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Image upload failed:",
                errorText
            );

            alert(
                "Image upload failed."
            );

            return null;
        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            alert(
                "Image upload did not return JSON."
            );

            return null;
        }


        const result =
            await response.json();


        console.log(
            "Image uploaded:",
            result
        );


        if (
            !result.mediaUrl
        ) {

            alert(
                "Image URL was not returned."
            );

            return null;
        }


        return result.mediaUrl;

    }
    catch (error) {

        console.error(
            "Image upload error:",
            error
        );

        alert(
            "Could not upload image."
        );

        return null;
    }
}


// ----------------------------------------------------------
// Send Image
// ----------------------------------------------------------

async function sendImage(
    file,
    senderId,
    receiverId
) {

    senderId =
        Number(senderId);

    receiverId =
        Number(receiverId);


    if (!senderId) {

        alert(
            "Sender is not available."
        );

        return false;
    }


    if (!receiverId) {

        alert(
            "Receiver is not available."
        );

        return false;
    }


    if (!file) {
        return false;
    }


    if (
        senderId ===
        receiverId
    ) {

        alert(
            "Sender and receiver cannot be the same."
        );

        return false;
    }


    if (
        !connection ||
        connection.state !==
        signalR.HubConnectionState.Connected
    ) {

        alert(
            "Chat connection is not ready."
        );

        return false;
    }


    try {

        // Upload image
        const mediaUrl =
            await uploadImage(file);


        if (!mediaUrl) {
            return false;
        }


        console.log(
            "URL received from server:",
            mediaUrl
        );


        // IMPORTANT:
        // Send ONLY ONCE
        await connection.invoke(
            "SendImageMessage",
            senderId,
            receiverId,
            mediaUrl
        );


        console.log(
            "Image message sent successfully."
        );


        return true;

    }
    catch (error) {

        console.error(
            "Could not send image:",
            error
        );


        alert(
            "Could not send image."
        );


        return false;
    }
}


// ==========================================================
// CURRENT USER FORM
// ==========================================================

function setupCurrentUserForm() {

    const form =
        document.getElementById(
            "sangitaForm"
        );


    if (!form) {

        console.error(
            "sangitaForm not found."
        );

        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUserId) {

                alert(
                    "Please login first."
                );

                return;
            }


            if (!selectedUserId) {

                alert(
                    "Please select a user first."
                );

                return;
            }


            const imageInput =
                document.getElementById(
                    "sangitaImage"
                );


            const file =
                imageInput?.files?.[0];


            // Image
            if (file) {

                const sent =
                    await sendImage(
                        file,
                        currentUserId,
                        selectedUserId
                    );


                if (sent) {

                    imageInput.value = "";


                    const preview =
                        document.getElementById(
                            "sangitaImagePreview"
                        );


                    if (preview) {
                        preview.innerHTML = "";
                    }
                }


                return;
            }


            // Text
            await sendMessage(
                currentUserId,
                selectedUserId,
                "sangitaInput"
            );
        }
    );
}


// ==========================================================
// SELECTED USER FORM
// ==========================================================

function setupSelectedUserForm() {

    const form =
        document.getElementById(
            "selectedUserForm"
        );


    if (!form) {

        console.error(
            "selectedUserForm not found."
        );

        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUserId) {

                alert(
                    "Please login first."
                );

                return;
            }


            if (!selectedUserId) {

                alert(
                    "Please select a user first."
                );

                return;
            }


            const imageInput =
                document.getElementById(
                    "selectedUserImage"
                );


            const file =
                imageInput?.files?.[0];


            // Selected user -> current user
            if (file) {

                const sent =
                    await sendImage(
                        file,
                        selectedUserId,
                        currentUserId
                    );


                if (sent) {

                    imageInput.value = "";


                    const preview =
                        document.getElementById(
                            "selectedImagePreview"
                        );


                    if (preview) {
                        preview.innerHTML = "";
                    }
                }


                return;
            }


            // Text
            await sendMessage(
                selectedUserId,
                currentUserId,
                "selectedUserInput"
            );
        }
    );
}


// ==========================================================
// CURRENT USER IMAGE SELECTION
// ==========================================================

function setupCurrentUserImage() {

    const input =
        document.getElementById(
            "sangitaImage"
        );


    if (!input) {

        console.error(
            "sangitaImage not found."
        );

        return;
    }


    input.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];


            if (!file) {
                return;
            }


            // Preview only
            previewImage(
                file,
                "sangitaImagePreview"
            );


            console.log(
                "Current user image selected:",
                file.name
            );
        }
    );
}


// ==========================================================
// SELECTED USER IMAGE SELECTION
// ==========================================================

function setupSelectedUserImage() {

    const input =
        document.getElementById(
            "selectedUserImage"
        );


    if (!input) {

        console.error(
            "selectedUserImage not found."
        );

        return;
    }


    input.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];


            if (!file) {
                return;
            }


            // Preview only
            previewImage(
                file,
                "selectedImagePreview"
            );


            console.log(
                "Selected user image selected:",
                file.name
            );
        }
    );
}


// ==========================================================
// SEARCH USERS
// ==========================================================

function setupSearch() {

    const input =
        document.getElementById(
            "searchUser"
        );


    if (!input) {
        return;
    }


    let searchTimer = null;


    input.addEventListener(
        "input",
        function () {

            const search =
                this.value.trim();


            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    function () {

                        loadUsers(
                            search
                        );

                    },
                    300
                );
        }
    );
}


// ==========================================================
// TYPING
// ==========================================================


// ----------------------------------------------------------
// Current User Typing
// ----------------------------------------------------------

function setupCurrentUserTyping() {

    const input =
        document.getElementById(
            "sangitaInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        async function () {

            if (
                !currentUserId ||
                !selectedUserId
            ) {
                return;
            }


            if (
                !connection ||
                connection.state !==
                signalR.HubConnectionState.Connected
            ) {
                return;
            }


            try {

                await connection.invoke(
                    "Typing",
                    Number(currentUserId),
                    Number(selectedUserId)
                );

            }
            catch (error) {

                console.log(
                    "Typing error:",
                    error
                );
            }


            clearTimeout(
                typingTimer
            );


            typingTimer =
                setTimeout(
                    function () {

                        const typing =
                            document.getElementById(
                                "typing"
                            );


                        if (typing) {

                            typing.textContent =
                                "";
                        }

                    },
                    2000
                );
        }
    );
}


// ----------------------------------------------------------
// Selected User Typing
// ----------------------------------------------------------

function setupSelectedUserTyping() {

    const input =
        document.getElementById(
            "selectedUserInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        async function () {

            if (
                !currentUserId ||
                !selectedUserId
            ) {
                return;
            }


            if (
                !connection ||
                connection.state !==
                signalR.HubConnectionState.Connected
            ) {
                return;
            }


            try {

                await connection.invoke(
                    "Typing",
                    Number(selectedUserId),
                    Number(currentUserId)
                );

            }
            catch (error) {

                console.log(
                    "Selected user typing error:",
                    error
                );
            }


            clearTimeout(
                typingTimer
            );


            typingTimer =
                setTimeout(
                    function () {

                        const typing =
                            document.getElementById(
                                "typing"
                            );


                        if (typing) {

                            typing.textContent =
                                "";
                        }

                    },
                    2000
                );
        }
    );
}


// ==========================================================
// ENTER KEY
// ==========================================================


// ----------------------------------------------------------
// Current User Enter Key
// ----------------------------------------------------------

function setupCurrentUserEnterKey() {

    const input =
        document.getElementById(
            "sangitaInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();


                sendMessage(
                    currentUserId,
                    selectedUserId,
                    "sangitaInput"
                );
            }
        }
    );
}


// ----------------------------------------------------------
// Selected User Enter Key
// ----------------------------------------------------------

function setupSelectedUserEnterKey() {

    const input =
        document.getElementById(
            "selectedUserInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();


                sendMessage(
                    selectedUserId,
                    currentUserId,
                    "selectedUserInput"
                );
            }
        }
    );
}


// ==========================================================
// REFRESH USERS
// ==========================================================

function startUserRefresh() {

    if (userRefreshTimer) {

        clearInterval(
            userRefreshTimer
        );
    }


    userRefreshTimer =
        setInterval(
            async function () {

                const searchInput =
                    document.getElementById(
                        "searchUser"
                    );


                const search =
                    searchInput
                        ? searchInput.value.trim()
                        : "";


                // IMPORTANT:
                // loadUsers() will always make
                // ONLY selected user online.
                await loadUsers(
                    search
                );


                await refreshCurrentUserDetails();

            },
            5000
        );
}


// ==========================================================
// LOGIN
// ==========================================================

function goToLogin() {

    window.location.href =
        "/login.html";
}


// ==========================================================
// LOGOUT
// ==========================================================

function logout() {

    console.log(
        "Logging out..."
    );


    // Stop SignalR
    if (connection) {

        connection
            .stop()
            .catch(
                error =>
                    console.log(
                        "SignalR stop error:",
                        error
                    )
            );
    }


    // Stop user refresh
    if (userRefreshTimer) {

        clearInterval(
            userRefreshTimer
        );

        userRefreshTimer =
            null;
    }


    // Remove login data
    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );

    localStorage.removeItem(
        "currentUser"
    );

    localStorage.removeItem(
        "authUser"
    );

    localStorage.removeItem(
        "currentUserId"
    );


    // Reset variables
    currentUser =
        null;

    currentUserId =
        null;

    selectedUser =
        null;

    selectedUserId =
        null;


    // Go to login
    window.location.href =
        "/login.html";
}


// ==========================================================
// START APPLICATION
// ==========================================================

async function startApplication() {

    console.log(
        "======================================"
    );

    console.log(
        "Starting ChatApp..."
    );

    console.log(
        "======================================"
    );


    // Get logged-in user
    const loggedIn =
        getCurrentUser();


    if (!loggedIn) {

        console.warn(
            "User is not logged in."
        );


        const chatUserName =
            document.getElementById(
                "chatUserName"
            );


        const chatStatus =
            document.getElementById(
                "chatStatus"
            );


        if (chatUserName) {

            chatUserName.textContent =
                "Please Login";
        }


        if (chatStatus) {

            chatStatus.textContent =
                "Login to start chatting";
        }


        return;
    }


    console.log(
        "Current User ID:",
        currentUserId
    );


    console.log(
        "Current User:",
        currentUser
    );


    // Display current user
    updateCurrentUserUI();


    // Refresh current user
    await refreshCurrentUserDetails();


    // Setup forms
    setupCurrentUserForm();
    setupSelectedUserForm();


    // Setup image inputs
    setupCurrentUserImage();
    setupSelectedUserImage();


    // Setup search
    setupSearch();


    // Setup typing
    setupCurrentUserTyping();
    setupSelectedUserTyping();


    // Setup Enter key
    setupCurrentUserEnterKey();
    setupSelectedUserEnterKey();


    // Start SignalR
    await startConnection();


    // Load users
    // At this point no user is selected,
    // therefore EVERYONE will be OFFLINE.
    await loadUsers();


    // Refresh users every 5 seconds
    startUserRefresh();


    console.log(
        "======================================"
    );

    console.log(
        "ChatApp started successfully."
    );

    console.log(
        "======================================"
    );
}


// ==========================================================
// PAGE LOAD
// ==========================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startApplication
    );

}
else {

    startApplication();
}