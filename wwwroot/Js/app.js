"use strict";

/* ==========================================================
   REAL-TIME CHAT APPLICATION
   ========================================================== */

const API_BASE_URL = (typeof window !== "undefined" && window.location && window.location.protocol.startsWith("http"))
    ? window.location.origin
    : "https://chatconvertion.onrender.com";

console.log("======================================");
console.log("Real-Time Chat app.js loaded");
console.log("======================================");


/* ==========================================================
   GLOBAL VARIABLES
   ========================================================== */

let currentUser = null;
let currentUserId = null;

let selectedUser = null;
let selectedUserId = null;

let connection = null;

/* One timeout per typing-indicator element, keyed by element id */
let typingTimers = {};

let userRefreshTimer = null;

/* Store latest users returned by API */
let cachedUsers = [];

const displayedMessageIds = new Set();

let recipientUserId = null;


/* ==========================================================
   HELPER FUNCTIONS
   ========================================================== */


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


/* ==========================================================
   CURRENT USER
   ========================================================== */

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
            localStorage.getItem(
                "currentUser"
            );

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
            localStorage.getItem(
                "authUser"
            );

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


    const nameElement =
        document.getElementById(
            "currentUserName"
        );

    if (nameElement) {

        nameElement.textContent =
            username;
    }


    const emailElement =
        document.getElementById(
            "currentUserEmail"
        );

    if (emailElement) {

        emailElement.textContent =
            email;
    }


    const sangitaTitle =
        document.getElementById(
            "sangitaTitle"
        );

    if (sangitaTitle) {

        sangitaTitle.textContent =
            `👤 ${username}`;
    }


    const sangitaUserId =
        document.getElementById(
            "sangitaUserId"
        );

    if (sangitaUserId) {

        sangitaUserId.textContent =
            `ID: ${currentUserId}`;
    }
}


async function refreshCurrentUserDetails() {

    if (!currentUserId) {
        return;
    }

    try {

        const response =
    await fetch(
        `${API_BASE_URL}/api/users`
    );
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

        /* Keep users cache updated */
        cachedUsers = users;

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


/* ==========================================================
   TYPING INDICATOR STYLES
   ========================================================== */

function addTypingStyles() {

    if (
        document.getElementById(
            "typing-indicator-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "typing-indicator-styles";

    style.textContent = `

        .typing-indicator {
            min-height: 0;
            height: 0;
            padding: 0 18px;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 5px;
            overflow: hidden;
            opacity: 0;
            transition:
                height 0.2s ease,
                opacity 0.2s ease,
                padding 0.2s ease;
            font-size: 13px;
            color: #6b7280;
        }

        .typing-indicator.show {
            height: 34px;
            padding-top: 6px;
            padding-bottom: 6px;
            opacity: 1;
        }

        .typing-indicator .typing-name {
            font-weight: 600;
        }

        .typing-indicator .typing-text {
            font-weight: 400;
        }

        .typing-indicator .typing-dots {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            margin-left: 2px;
        }

        .typing-indicator .typing-dots span {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: currentColor;
            opacity: 0.35;
            animation:
                typingDot 1.4s
                infinite ease-in-out;
        }

        .typing-indicator .typing-dots span:nth-child(1) {
            animation-delay: 0s;
        }

        .typing-indicator .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-indicator .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typingDot {

            0%,
            60%,
            100% {
                transform: translateY(0);
                opacity: 0.35;
            }

            30% {
                transform: translateY(-4px);
                opacity: 1;
            }
        }
    `;

    document.head.appendChild(style);
}


/* ==========================================================
   SHOW TYPING INDICATOR
   ========================================================== */

function showTypingIndicator(
    senderId,
    receiverId
) {

    senderId =
        Number(senderId);

    receiverId =
        Number(receiverId);


    if (
        !currentUserId ||
        !selectedUserId
    ) {
        return;
    }


    let targetElementId = null;
    let typerName = "";


    if (
        senderId === Number(currentUserId) &&
        receiverId === Number(selectedUserId)
    ) {

        targetElementId =
            "typingIndicatorSelectedBox";

        typerName =
            getUsername(currentUser);
    }

    else if (
        senderId === Number(selectedUserId) &&
        receiverId === Number(currentUserId)
    ) {

        targetElementId =
            "typingIndicatorCurrentBox";

        typerName =
            getUsername(selectedUser);
    }

    else {
        return;
    }


    const typingEl =
        document.getElementById(
            targetElementId
        );

    if (!typingEl) {
        return;
    }


    typingEl.innerHTML = `

        <span class="typing-name">
            ${escapeHtml(typerName)}
        </span>

        <span class="typing-text">
            is typing
        </span>

        <span class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </span>

    `;


    typingEl.classList.add(
        "show"
    );


    clearTimeout(
        typingTimers[targetElementId]
    );


    typingTimers[targetElementId] =
        setTimeout(
            function () {

                typingEl.innerHTML =
                    "";

                typingEl.classList.remove(
                    "show"
                );

            },
            2500
        );
}


/* ==========================================================
   HIDE TYPING INDICATOR
   ========================================================== */

function hideTypingIndicator(elementId) {

    const idsToHide =
        elementId
            ? [elementId]
            : [
                "typingIndicatorCurrentBox",
                "typingIndicatorSelectedBox"
            ];


    idsToHide.forEach(
        function (id) {

            clearTimeout(
                typingTimers[id]
            );

            const typingEl =
                document.getElementById(
                    id
                );

            if (!typingEl) {
                return;
            }

            typingEl.innerHTML =
                "";

            typingEl.classList.remove(
                "show"
            );
        }
    );
}


/* ==========================================================
   BROWSER NOTIFICATION - NEW MESSAGE
   ========================================================== */

let notificationPermissionRequested = false;


async function requestNotificationPermission() {

    if (!("Notification" in window)) {

        console.warn(
            "Browser notifications are not supported."
        );

        return false;
    }


    if (
        Notification.permission ===
        "granted"
    ) {

        return true;
    }


    if (
        Notification.permission ===
        "denied"
    ) {

        console.warn(
            "Browser notification permission was denied."
        );

        return false;
    }


    if (notificationPermissionRequested) {
        return false;
    }


    notificationPermissionRequested =
        true;


    try {

        const permission =
            await Notification.requestPermission();

        console.log(
            "Notification permission:",
            permission
        );

        return permission === "granted";

    }
    catch (error) {

        console.error(
            "Notification permission error:",
            error
        );

        return false;
    }
}


async function showMessageNotification(message) {

    if (
        !message ||
        !currentUserId
    ) {
        return;
    }


    const senderId =
        getMessageSenderId(message);

    const receiverId =
        getMessageReceiverId(message);


    /* Only notify the actual recipient */

    if (
        Number(receiverId) !==
        Number(currentUserId)
    ) {
        return;
    }


    /* Do not notify yourself */

    if (
        Number(senderId) ===
        Number(currentUserId)
    ) {
        return;
    }


    const allowed =
        await requestNotificationPermission();


    if (!allowed) {
        return;
    }


    let senderName =
        "New Message";


    /* Use currently selected user's name when available */

    if (
        selectedUser &&
        Number(
            getUserId(selectedUser)
        ) === Number(senderId)
    ) {

        senderName =
            getUsername(selectedUser);

    }
    else {

        /* Find sender name from users API */

        try {

            const response =
                await fetch(
                    "/api/users"
                );


            if (response.ok) {

                const users =
                    await response.json();


                if (Array.isArray(users)) {

                    const sender =
                        users.find(
                            user =>
                                Number(
                                    getUserId(user)
                                ) === Number(senderId)
                        );


                    if (sender) {

                        senderName =
                            getUsername(sender);
                    }
                }
            }

        }
        catch (error) {

            console.warn(
                "Could not find sender name:",
                error
            );
        }
    }


    const messageType =
        getMessageType(message)
            .toLowerCase();


    let messagePreview = "";


    if (messageType === "image") {

        messagePreview =
            "📷 Image";

    }
    else {

        messagePreview =
            getMessageText(message).trim() ||
            "New message";
    }


    if (
        messagePreview.length > 100
    ) {

        messagePreview =
            messagePreview.substring(
                0,
                100
            ) +
            "...";
    }


    try {

        const notification =
            new Notification(
                senderName,
                {
                    body: messagePreview,
                    icon: getProfileImage(
                        selectedUser
                    ) || "/favicon.ico",
                    tag: `chat-message-${senderId}`,
                    renotify: true
                }
            );


        notification.onclick =
            function () {

                window.focus();

                notification.close();


                if (
                    selectedUser &&
                    Number(
                        getUserId(selectedUser)
                    ) === Number(senderId)
                ) {

                    loadMessages();
                }
            };


        setTimeout(
            function () {
                notification.close();
            },
            5000
        );

    }
    catch (error) {

        console.error(
            "Could not show notification:",
            error
        );
    }
}


/* ==========================================================
   SIGNALR CONNECTION
   ========================================================== */

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
        localStorage.getItem(
            "token"
        );


    connection =
    new signalR.HubConnectionBuilder()
        .withUrl(
            `${API_BASE_URL}/chatHub`,
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


    connection.on(
        "ReceiveMessage",
        function (message) {

            console.log(
                "Received message:",
                message
            );


            /* Show in-app popup and browser notification for recipient */
            if (message) {
                const sId = getMessageSenderId(message);
                const rId = getMessageReceiverId(message);
                if (rId === Number(currentUserId) && sId !== Number(currentUserId)) {
                    let senderName = `User ID ${sId}`;
                    const sUser = cachedUsers.find(u => Number(getUserId(u)) === Number(sId));
                    if (sUser) {
                        senderName = getUsername(sUser);
                    } else if (selectedUser && Number(getUserId(selectedUser)) === Number(sId)) {
                        senderName = getUsername(selectedUser);
                    }

                    const preview = getMessageType(message).toLowerCase() === "image"
                        ? "📷 Sent an image"
                        : (getMessageText(message) || "New message");

                    showNotification({
                        title: `Message from ${senderName}`,
                        message: preview,
                        type: "info",
                        duration: 5000
                    });
                }
            }

            showMessageNotification(
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


            hideTypingIndicator();


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


    /* Still listen for server-relayed typing events,
       for real cross-browser / multi-device usage */

    connection.on(
        "UserTyping",
        function (
            senderId,
            receiverId
        ) {

            console.log(
                "User typing (from server):",
                senderId,
                receiverId
            );


            showTypingIndicator(
                senderId,
                receiverId
            );
        }
    );


    connection.onreconnected(
        async function () {

            console.log(
                "SignalR reconnected."
            );

            if (currentUserId) {
                try {
                    await connection.invoke("RegisterUser", Number(currentUserId));
                } catch (e) {}
            }

            if (selectedUserId) {

                await loadMessages();
            }
        }
    );


    connection.onclose(
        function (error) {

            console.log(
                "SignalR connection closed.",
                error
            );
        }
    );


    try {

        await connection.start();

        console.log(
            "SignalR connected successfully."
        );

        if (currentUserId) {
            try {
                await connection.invoke("RegisterUser", Number(currentUserId));
                console.log("SignalR registered user:", currentUserId);
            } catch (err) {
                console.warn("RegisterUser failed:", err);
            }
        }

    }
    catch (error) {

        console.error(
            "SignalR connection failed:",
            error
        );
    }
}


/* ==========================================================
   USERS
   ========================================================== */

async function loadUsers(search = "") {

    try {

        let url =
            `${API_BASE_URL}/api/users`;


        if (
            search.trim() !== ""
        ) {

            url =
                `${API_BASE_URL}/api/users?search=${encodeURIComponent(
                    search
                )}`;
        }


        console.log(
            "Loading users from:",
            url
        );


        const response =
            await fetch(url);


        console.log(
            "Users API status:",
            response.status
        );


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


        console.log(
            "Users received from Render:",
            users
        );


        if (!Array.isArray(users)) {

            console.error(
                "Users API did not return array:",
                users
            );

            return;
        }


        cachedUsers = users;


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


        list.innerHTML =
            "";


        users.forEach(
            function (user) {

                const userId =
                    getUserId(user);


                if (!userId) {
                    return;
                }


                /*
                 * Don't show current logged-in
                 * user in the user list.
                 */

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


                const isSelected =
                    selectedUserId !== null &&
                    Number(userId) ===
                    Number(selectedUserId);


                /*
                 * At the moment the selected user
                 * is displayed as online.
                 */

                const online =
                    isSelected;


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


                let avatarHTML =
                    "";


                if (profileImage) {

                    avatarHTML = `

                        <div class="user-avatar">

                            <img
                                src="${escapeHtml(
                                    profileImage
                                )}"
                                alt="${escapeHtml(
                                    username
                                )}"
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


                userElement.innerHTML = `

                    ${avatarHTML}

                    <div class="user-info">

                        <h3>
                            ${escapeHtml(
                                username
                            )}
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


        /*
         * Populate recipient dropdown
         */

        populateRecipientUsers(users);

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


/* ==========================================================
   CHECK RECIPIENT OFFLINE STATUS
   ========================================================== */

function isUserOffline(userId) {

    userId =
        Number(userId);

    if (!userId) {
        return false;
    }


    /*
     * First check the selected user because this is the
     * most direct user object when a chat is selected.
     */

    if (
        selectedUser &&
        Number(getUserId(selectedUser)) === userId
    ) {

        const selectedOnline =
            selectedUser.isOnline ??
            selectedUser.IsOnline ??
            selectedUser.online ??
            selectedUser.Online;

        if (
            selectedOnline !== undefined &&
            selectedOnline !== null
        ) {

            return (
                selectedOnline === false ||
                selectedOnline === 0 ||
                String(selectedOnline).toLowerCase() === "false" ||
                String(selectedOnline) === "0"
            );
        }
    }


    /*
     * Otherwise check the latest users returned
     * by /api/users.
     */

    const user =
        cachedUsers.find(
            function (item) {

                return (
                    Number(getUserId(item)) ===
                    userId
                );
            }
        );


    if (!user) {
        return false;
    }


    const isOnline =
        user.isOnline ??
        user.IsOnline ??
        user.online ??
        user.Online;


    if (
        isOnline === undefined ||
        isOnline === null
    ) {
        return false;
    }


    return (
        isOnline === false ||
        isOnline === 0 ||
        String(isOnline).toLowerCase() === "false" ||
        String(isOnline) === "0"
    );
}


/* ==========================================================
   SELECT USER
   ========================================================== */

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


    selectedUser =
        user;

    selectedUserId =
        id;

    recipientUserId =
        id;

    const recipientSelect =
        document.getElementById("recipientUserSelect");
    if (recipientSelect && String(recipientSelect.value) !== String(id)) {
        recipientSelect.value = String(id);
    }

    const username =
        getUsername(user);

    console.log(
        "Selected user:",
        selectedUser
    );


    hideTypingIndicator();


    const chatUserName =
        document.getElementById(
            "chatUserName"
        );


    if (chatUserName) {

        chatUserName.textContent =
            username;
    }


    const chatStatus =
        document.getElementById(
            "chatStatus"
        );


    if (chatStatus) {

        chatStatus.innerHTML =
            `<span class="status-dot"></span> Online`;
    }


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


    const selectedInput =
        document.getElementById(
            "selectedUserInput"
        );


    if (selectedInput) {

        selectedInput.placeholder =
            `Message ${username}...`;
    }


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


    const searchInput =
        document.getElementById(
            "searchUser"
        );


    const search =
        searchInput
            ? searchInput.value.trim()
            : "";


    await loadUsers(
        search
    );


    await loadMessages();
}


/* ==========================================================
   MESSAGES
   ========================================================== */

async function loadMessages() {

    if (
        !currentUserId ||
        !selectedUserId
    ) {
        return;
    }


    const url =
    `${API_BASE_URL}/api/messages/${currentUserId}/${selectedUserId}`;
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


        clearMessages(
            "sangitaMessages"
        );

        clearMessages(
            "selectedMessages"
        );


        displayedMessageIds.clear();


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


    const senderId =
        getMessageSenderId(
            message
        );


    const isSent =
        Number(senderId) ===
        Number(perspectiveUserId);


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        isSent
            ? "message sent"
            : "message received";


    const messageType =
        getMessageType(
            message
        ).toLowerCase();


    const empty =
        container.querySelector(
            ".empty-chat"
        );


    if (empty) {
        empty.remove();
    }


    if (
        messageType ===
        "image"
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


    container.appendChild(
        messageElement
    );


    container.scrollTop =
        container.scrollHeight;
}


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


    container.innerHTML =
        "";
}


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


/* ==========================================================
   SEND TEXT MESSAGE
   ========================================================== */

/* ==========================================================
   SEND TEXT MESSAGE
   ========================================================== */

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

        hideTypingIndicator();


        /*
         * =====================================================
         * CHECK RECIPIENT STATUS BEFORE SENDING
         * =====================================================
         *
         * We only remember whether the recipient is offline.
         *
         * IMPORTANT:
         * There is NO alert here.
         */

        const recipientWasOffline =
            isUserOffline(receiverId);


        /*
         * =====================================================
         * SEND MESSAGE
         * =====================================================
         */

        await connection.invoke(
            "SendMessage",
            senderId,
            receiverId,
            message
        );


        /*
         * Clear input only after successful sending.
         */

        input.value =
            "";

        input.focus();


        console.log(
            "Text message sent:",
            message
        );

        let recipientName = "";
        const rUser = cachedUsers.find(u => Number(getUserId(u)) === Number(receiverId));
        if (rUser) {
            recipientName = getUsername(rUser);
        } else if (selectedUser && Number(getUserId(selectedUser)) === Number(receiverId)) {
            recipientName = getUsername(selectedUser);
        } else {
            recipientName = `User ID ${receiverId}`;
        }

        showNotification({
            title: "Message Sent",
            message: `Message sent to ${recipientName}`,
            type: "success",
            duration: 3500
        });

        if (recipientWasOffline) {

            await showSentMessageNotification(
                senderId,
                receiverId
            );
        }


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
/* ==========================================================
   IMAGE FUNCTIONS
   ========================================================== */

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


    preview.innerHTML =
        "";


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


    reader.readAsDataURL(
        file
    );
}


async function uploadImage(file) {

    if (!file) {
        return null;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


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
        `${API_BASE_URL}/api/messages/upload-image`,
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

        const mediaUrl =
            await uploadImage(
                file
            );


        if (!mediaUrl) {
            return false;
        }


        console.log(
            "URL received from server:",
            mediaUrl
        );


        await connection.invoke(
            "SendImageMessage",
            senderId,
            receiverId,
            mediaUrl
        );


        console.log(
            "Image message sent successfully."
        );

        let recipientName = "";
        const rUser = cachedUsers.find(u => Number(getUserId(u)) === Number(receiverId));
        if (rUser) {
            recipientName = getUsername(rUser);
        } else if (selectedUser && Number(getUserId(selectedUser)) === Number(receiverId)) {
            recipientName = getUsername(selectedUser);
        } else {
            recipientName = `User ID ${receiverId}`;
        }

        showNotification({
            title: "Image Sent",
            message: `Image sent to ${recipientName}`,
            type: "success",
            duration: 3500
        });

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


/* ==========================================================
   CURRENT USER FORM
   ========================================================== */

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


            /* Use recipientUserId from the dropdown;
               fall back to selectedUserId if dropdown not used */

            const targetReceiverId =
                recipientUserId ||
                selectedUserId;


            if (!targetReceiverId) {

                alert(
                    "Please select a recipient from the dropdown first."
                );

                return;
            }


            const imageInput =
                document.getElementById(
                    "sangitaImage"
                );


            const file =
                imageInput?.files?.[0];


            if (file) {

                const sent =
                    await sendImage(
                        file,
                        currentUserId,
                        targetReceiverId
                    );


                if (sent) {

                    imageInput.value =
                        "";

                    const preview =
                        document.getElementById(
                            "sangitaImagePreview"
                        );


                    if (preview) {
                        preview.innerHTML =
                            "";
                    }
                }


                return;
            }


            await sendMessage(
                currentUserId,
                targetReceiverId,
                "sangitaInput"
            );
        }
    );
}


/* ==========================================================
   SELECTED USER FORM
   ========================================================== */

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


            if (file) {

                const sent =
                    await sendImage(
                        file,
                        selectedUserId,
                        currentUserId
                    );


                if (sent) {

                    imageInput.value =
                        "";

                    const preview =
                        document.getElementById(
                            "selectedImagePreview"
                        );


                    if (preview) {

                        preview.innerHTML =
                            "";
                    }

                }


                return;
            }


            await sendMessage(
                selectedUserId,
                currentUserId,
                "selectedUserInput"
            );
        }
    );
}


/* ==========================================================
   CURRENT USER IMAGE
   ========================================================== */

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


/* ==========================================================
   SELECTED USER IMAGE
   ========================================================== */

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


/* ==========================================================
   SEARCH USERS
   ========================================================== */

function setupSearch() {

    const input =
        document.getElementById(
            "searchUser"
        );


    if (!input) {
        return;
    }


    let searchTimer =
        null;


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


/* ==========================================================
   TYPING INDICATOR - SEND EVENT
   ========================================================== */

async function sendTypingEvent(
    senderId,
    receiverId
) {

    senderId =
        Number(senderId);

    receiverId =
        Number(receiverId);


    if (
        !senderId ||
        !receiverId
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
            senderId,
            receiverId
        );

    }
    catch (error) {

        console.log(
            "Typing error:",
            error
        );
    }
}


/* ----------------------------------------------------------
   Current User Typing
   ---------------------------------------------------------- */

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
        function () {

            const targetId =
                recipientUserId ||
                selectedUserId;


            if (
                !currentUserId ||
                !targetId
            ) {
                return;
            }


            if (
                input.value.trim() ===
                ""
            ) {

                hideTypingIndicator(
                    "typingIndicatorSelectedBox"
                );

                return;
            }


            showTypingIndicator(
                currentUserId,
                targetId
            );


            sendTypingEvent(
                currentUserId,
                targetId
            );
        }
    );
}


/* ----------------------------------------------------------
   Selected User Typing
   ---------------------------------------------------------- */

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
        function () {

            if (
                !currentUserId ||
                !selectedUserId
            ) {
                return;
            }


            if (
                input.value.trim() ===
                ""
            ) {

                hideTypingIndicator(
                    "typingIndicatorCurrentBox"
                );

                return;
            }


            showTypingIndicator(
                selectedUserId,
                currentUserId
            );


            sendTypingEvent(
                selectedUserId,
                currentUserId
            );
        }
    );
}


/* ==========================================================
   ENTER KEY
   ========================================================== */

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


                const targetId =
                    recipientUserId ||
                    selectedUserId;


                sendMessage(
                    currentUserId,
                    targetId,
                    "sangitaInput"
                );
            }
        }
    );
}


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


/* ==========================================================
   REFRESH USERS
   ========================================================== */

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


                await loadUsers(
                    search
                );


                await refreshCurrentUserDetails();

            },
            5000
        );
}


/* ==========================================================
   RECIPIENT DROPDOWN SETUP
   ========================================================== */

function setupRecipientDropdown() {

    const select =
        document.getElementById(
            "recipientUserSelect"
        );

    if (!select) {
        return;
    }

    select.addEventListener(
        "change",
        async function () {

            const id =
                Number(this.value);

            if (
                !id ||
                Number.isNaN(id)
            ) {
                recipientUserId =
                    null;
                return;
            }

            recipientUserId =
                id;

            console.log(
                "Recipient selected from dropdown:",
                recipientUserId
            );

            // Find user in cached list or synthesize user object
            let targetUser =
                cachedUsers.find(
                    u => Number(getUserId(u)) === id
                );

            if (!targetUser) {
                const optText =
                    select.options[select.selectedIndex]?.text || "";
                const cleanName =
                    optText.replace(/\s*\(ID:\s*\d+\)$/i, "").trim() || `User ${id}`;
                targetUser = {
                    id: id,
                    username: cleanName,
                    name: cleanName
                };
            }

            await selectUser(targetUser);
        }
    );
}


/* ==========================================================
   LOGIN
   ========================================================== */

function goToLogin() {

    window.location.href =
        "/login.html";
}


/* ==========================================================
   LOGOUT
   ========================================================== */

function logout() {

    console.log(
        "Logging out..."
    );


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


    if (userRefreshTimer) {

        clearInterval(
            userRefreshTimer
        );

        userRefreshTimer =
            null;
    }


    hideTypingIndicator();


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


    currentUser =
        null;

    currentUserId =
        null;

    selectedUser =
        null;

    selectedUserId =
        null;

    cachedUsers =
        [];


    window.location.href =
        "/login.html";
}

/* ==========================================================
   IN-APP TOAST POPUP NOTIFICATION
   ========================================================== */

function showNotification({ title = "", message = "", type = "info", duration = 4000 } = {}) {
    let container = document.getElementById("chatToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "chatToastContainer";
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 380px;
            width: calc(100% - 40px);
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const isSuccess = type === "success";
    const isError = type === "error";
    const borderColor = isSuccess ? "#10b981" : (isError ? "#ef4444" : "#4f46e5");
    const iconColor = isSuccess ? "#059669" : (isError ? "#dc2626" : "#4338ca");
    const iconBg = isSuccess ? "#ecfdf5" : (isError ? "#fef2f2" : "#eef2ff");
    const iconChar = isSuccess ? "✓" : (isError ? "✕" : "💬");

    toast.style.cssText = `
        background: #ffffff;
        color: #1f2937;
        border-left: 5px solid ${borderColor};
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.08);
        padding: 14px 18px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(-12px);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    toast.innerHTML = `
        <div style="background: ${iconBg}; color: ${iconColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; font-size: 15px;">
            ${iconChar}
        </div>
        <div style="flex: 1; min-width: 0;">
            ${title ? `<div style="font-weight: 600; color: #111827; margin-bottom: 2px;">${escapeHtml(title)}</div>` : ""}
            <div style="color: #4b5563; word-break: break-word; line-height: 1.45; font-size: 13.5px;">${escapeHtml(message)}</div>
        </div>
        <button type="button" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; margin-left: 4px;" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector("button");
    const removeToast = () => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-12px)";
        setTimeout(() => toast.remove(), 250);
    };
    if (closeBtn) closeBtn.onclick = removeToast;

    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    if (duration > 0) {
        setTimeout(removeToast, duration);
    }
}

/* ==========================================================
   NOTIFICATION - MESSAGE SENT TO OFFLINE USER
   ========================================================== */

async function showSentMessageNotification(
    senderId,
    receiverId
) {

    senderId = Number(senderId);
    receiverId = Number(receiverId);

    if (!senderId || !receiverId) {
        return;
    }

    const notificationText =
        `From User ID ${senderId} to User ID ${receiverId}: one new message sent.`;

    /*
     * First show notification inside the website.
     * This works as a fallback even if browser
     * notification permission is not available.
     */
    showNotification({
        title: "New Message Sent",
        message: notificationText,
        type: "success",
        duration: 5000
    });

    /*
     * Browser notification
     */
    try {

        const allowed =
            await requestNotificationPermission();

        if (!allowed) {
            return;
        }

        const notification =
            new Notification(
                "New Message Sent",
                {
                    body: notificationText,
                    icon: "/favicon.ico",
                    tag:
                        `sent-message-${senderId}-${receiverId}-${Date.now()}`,
                    renotify: true
                }
            );

        setTimeout(
            function () {

                notification.close();

            },
            5000
        );

    }
    catch (error) {

        console.warn(
            "Could not show sent-message browser notification:",
            error
        );
    }
}   

/* ==========================================================
   START APPLICATION
   ========================================================== */

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


    addTypingStyles();


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


    /* Request browser notification permission */

    requestNotificationPermission();


    updateCurrentUserUI();


    await refreshCurrentUserDetails();


    setupCurrentUserForm();

    setupSelectedUserForm();


    setupCurrentUserImage();

    setupSelectedUserImage();


    setupSearch();


    setupRecipientDropdown();


    setupCurrentUserTyping();

    setupSelectedUserTyping();


    setupCurrentUserEnterKey();

    setupSelectedUserEnterKey();


    await startConnection();


    await loadUsers();


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


/* ==========================================================
   PAGE LOAD
   ========================================================== */

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


function populateRecipientUsers(users) {

    const select =
        document.getElementById(
            "recipientUserSelect"
        );


    if (!select) {
        return;
    }


    const previousValue =
        select.value;


    select.innerHTML = `
        <option value="">
            Select recipient
        </option>
    `;


    users.forEach(
        user => {

            const id =
                getUserId(user);

            const name =
                getUsername(user);


            if (!id) {
                return;
            }


            // Don't allow current user to select themselves

            if (
                String(id) ===
                String(currentUserId)
            ) {
                return;
            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                id;


            option.textContent =
                `${name} (ID: ${id})`;


            select.appendChild(
                option
            );
        }
    );


    // Keep previously selected recipient

    if (
        previousValue &&
        [...select.options].some(
            option =>
                option.value ===
                previousValue
        )
    ) {

        select.value =
            previousValue;
    }


    // If a chat user is selected, use them as default recipient

    if (
        !select.value &&
        selectedUserId
    ) {

        const exists =
            [...select.options].some(
                option =>
                    String(option.value) ===
                    String(selectedUserId)
            );


        if (exists) {

            select.value =
                selectedUserId;
        }
    }


    recipientUserId =
        select.value || null;
}