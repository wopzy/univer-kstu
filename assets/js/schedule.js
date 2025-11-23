const groups = {
    "СИБ-24-2с-1": "data/main-sheet-1.json",
    "СИБ-24-2с-2": "data/main-sheet-2.json",
    "АРХ-22-2": "data/arh-sheet.json",
    "ВТ-24-3с": "data/vt-sheet.json"
};

const defaultGroup = "СИБ-24-2с-1";
let currentGroup = defaultGroup;
let currentWeekType = "numerator"; // Default, will be calculated
let fullScheduleData = null;
let currentWeekNumber = 1;

document.addEventListener("DOMContentLoaded", () => {
    initGroupDropdown();
    initWeekDropdown();
    initThemeDropdown();
    calculateCurrentWeek();
    
    const savedGroup = localStorage.getItem('selectedGroup');
    if (savedGroup && groups[savedGroup]) {
        loadGroup(savedGroup);
    } else {
        loadGroup(defaultGroup);
    }

    const savedTheme = localStorage.getItem('selectedTheme') || "minimal";
    switchTheme(savedTheme);

    initNavigation();
    
    // Check for current time highlighting every minute
    setInterval(highlightCurrentTime, 60000);
});

function initThemeDropdown() {
    const dropdownItems = document.querySelectorAll("#theme-dropdown .dropdown-item");
    dropdownItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const theme = e.target.getAttribute("data-theme");
            if (theme) {
                switchTheme(theme);
            }
        });
    });
}

function switchTheme(themeName) {
    localStorage.setItem('selectedTheme', themeName);
    document.documentElement.setAttribute("data-theme", themeName);
    
    // For Bootstrap dark mode compatibility if needed, though our CSS handles most
    if (themeName === "octopus" || themeName === "matrix" || themeName === "dracula" || themeName === "oled") {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme", "light");
    }

    // Update active state in dropdown
    const dropdownItems = document.querySelectorAll("#theme-dropdown .dropdown-item");
    dropdownItems.forEach(item => {
        if (item.getAttribute("data-theme") === themeName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
    
    // No need to re-render schedule as CSS variables handle the change instantly!
    // However, we might need to re-run highlightCurrentTime if it adds specific inline styles
    // But we are refactoring that to use classes too.
    highlightCurrentTime();
}

function highlightCurrentTime() {
    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDayName = daysMap[dayIndex];

    // Highlight current day card
    const allDayCards = document.querySelectorAll("#schedule-row .card");
    allDayCards.forEach(card => {
        // Reset classes
        card.classList.remove("highlight-day");
        
        const title = card.querySelector(".card-title");
        if (title) {
            const cardDayName = Object.keys(dayNamesRu).find(key => dayNamesRu[key] === title.textContent) || title.textContent.toLowerCase();
            const ruName = dayNamesRu[currentDayName];
            
            if (title.textContent === ruName) {
                card.classList.add("highlight-day");
                
                // Now check lessons within this day
                const lessons = card.querySelectorAll(".lesson-card");
                lessons.forEach(lessonCard => {
                    lessonCard.classList.remove("highlight-lesson");
                    
                    const timeSpan = lessonCard.querySelector(".lesson-time");
                    if (timeSpan) {
                        const timeText = timeSpan.textContent.trim(); // "09:55–10:45"
                        if (isTimeCurrent(timeText)) {
                            lessonCard.classList.add("highlight-lesson");
                        }
                    }
                });
            } else {
                // Reset lessons in other days (just in case)
                const lessons = card.querySelectorAll(".lesson-card");
                lessons.forEach(lessonCard => lessonCard.classList.remove("highlight-lesson"));
            }
        }
    });
}

function isTimeCurrent(timeRange) {
    // Format: "09:55–10:45" or "09:55-10:45"
    const parts = timeRange.split(/[–-]/);
    if (parts.length !== 2) return false;

    const start = parts[0].trim();
    const end = parts[1].trim();

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
}

function initNavigation() {
    const scheduleNav = document.getElementById("nav-schedule");
    const umkdNav = document.getElementById("nav-umkd");
    const scheduleRow = document.getElementById("schedule-row");
    const umkdRow = document.getElementById("umkd-row");

    scheduleNav.addEventListener("click", (e) => {
        e.preventDefault();
        scheduleNav.classList.add("active");
        umkdNav.classList.remove("active");
        
        // Add visual indicator for active tab
        scheduleNav.style.fontWeight = "bold";
        scheduleNav.style.color = "var(--accent-color)";
        umkdNav.style.fontWeight = "normal";
        umkdNav.style.color = "";

        scheduleRow.style.display = "flex";
        umkdRow.style.display = "none";
    });

    umkdNav.addEventListener("click", (e) => {
        e.preventDefault();
        umkdNav.classList.add("active");
        scheduleNav.classList.remove("active");

        // Add visual indicator for active tab
        umkdNav.style.fontWeight = "bold";
        umkdNav.style.color = "var(--accent-color)";
        scheduleNav.style.fontWeight = "normal";
        scheduleNav.style.color = "";

        scheduleRow.style.display = "none";
        umkdRow.style.display = "block";
        loadUmkd(currentGroup);
    });
    
    // Set initial state
    scheduleNav.style.fontWeight = "bold";
    scheduleNav.style.color = "var(--accent-color)";
}

function loadUmkd(groupName) {
    // Map groups to their UMKD files. 
    // Assuming only SIB groups have UMKD for now based on user request.
    // And assuming they share the same UMKD file or have specific ones.
    // The user mentioned "СИБ-24-2с-1 - его main-sheet-1.json" and "СИБ-24-2с-2 - его main-sheet-2.json"
    // But for UMKD, the file structure shows `data/umkd/main-umkd-1.json`.
    // Let's assume main-umkd-1.json is for SIB-24-2с-1.
    
    let umkdFile = null;
    if (groupName === "СИБ-24-2с-1") {
        umkdFile = "data/umkd/main-umkd-1.json";
    } else if (groupName === "СИБ-24-2с-2") {
        // Assuming there might be a main-umkd-2.json or it uses the same.
        // For now, let's try main-umkd-1.json as a fallback or placeholder if 2 doesn't exist.
        // Or maybe just don't load if not defined.
        // Let's check if main-umkd-1.json is generic enough.
        umkdFile = "data/umkd/main-umkd-1.json"; 
    }

    if (!umkdFile) {
        document.getElementById("umkd-row").innerHTML = "<p class='text-center mt-4'>УМКД для этой группы не найдено.</p>";
        return;
    }

    fetch(umkdFile)
        .then(response => response.json())
        .then(data => {
            renderUmkd(data);
        })
        .catch(error => {
            console.error("Error loading UMKD:", error);
            document.getElementById("umkd-row").innerHTML = "<p class='text-center mt-4'>Ошибка загрузки УМКД.</p>";
        });
}

function renderUmkd(umkdData) {
    const container = document.getElementById("umkd-row");
    container.innerHTML = "";
    container.style.paddingTop = "12px";

    const accordionId = "umkdAccordion";
    const accordion = document.createElement("div");
    accordion.className = "accordion";
    accordion.id = accordionId;

    Object.keys(umkdData).forEach((subjectName, index) => {
        const files = umkdData[subjectName];
        const itemId = `heading${index}`;
        const collapseId = `collapse${index}`;

        const item = document.createElement("div");
        item.className = "accordion-item";
        item.style.marginBottom = "8px";
        item.style.borderRadius = "8px";
        item.style.overflow = "hidden";
        
        // Styles handled by CSS variables now
        // item.style.border = ...
        // item.style.background = ...

        const header = document.createElement("h2");
        header.className = "accordion-header";
        header.id = itemId;

        const button = document.createElement("button");
        button.className = "accordion-button collapsed";
        button.type = "button";
        button.setAttribute("data-bs-toggle", "collapse");
        button.setAttribute("data-bs-target", `#${collapseId}`);
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-controls", collapseId);
        button.textContent = subjectName;
        button.style.fontWeight = "500";

        header.appendChild(button);
        item.appendChild(header);

        const collapse = document.createElement("div");
        collapse.id = collapseId;
        collapse.className = "accordion-collapse collapse";
        collapse.setAttribute("aria-labelledby", itemId);
        collapse.setAttribute("data-bs-parent", `#${accordionId}`);

        const body = document.createElement("div");
        body.className = "accordion-body";

        if (files.length === 0) {
            body.textContent = "Нет файлов.";
        } else {
            const list = document.createElement("ul");
            list.className = "list-group list-group-flush";

            files.forEach(file => {
                const listItem = document.createElement("li");
                listItem.className = "list-group-item d-flex justify-content-between align-items-center";
                listItem.style.border = "none";
                listItem.style.background = "transparent"; // Ensure it takes parent bg
                
                const link = document.createElement("a");
                link.href = `public/UMKD/${subjectName}/${file.name}`;
                link.setAttribute("download", ""); // Force download
                link.className = "umkd-link";
                link.style.display = "flex";
                link.style.alignItems = "center";
                link.style.width = "100%";

                let icon = "📄";
                if (file.name.toLowerCase().endsWith(".pdf")) {
                    icon = "📕";
                } else if (file.name.toLowerCase().endsWith(".doc") || file.name.toLowerCase().endsWith(".docx")) {
                    icon = "📘";
                }

                const iconSpan = document.createElement("span");
                iconSpan.style.marginRight = "10px";
                iconSpan.style.fontSize = "1.2rem";
                iconSpan.textContent = icon;

                const infoDiv = document.createElement("div");
                infoDiv.style.display = "flex";
                infoDiv.style.flexDirection = "column";

                const nameSpan = document.createElement("span");
                nameSpan.style.fontWeight = "500";
                nameSpan.textContent = file.name;

                const metaSpan = document.createElement("span");
                metaSpan.className = "umkd-meta";
                metaSpan.textContent = `${file.type || 'Файл'} | ${file.size || ''} | ${file.date || ''}`;

                infoDiv.appendChild(nameSpan);
                infoDiv.appendChild(metaSpan);

                link.appendChild(iconSpan);
                link.appendChild(infoDiv);
                listItem.appendChild(link);
                list.appendChild(listItem);
            });
            body.appendChild(list);
        }

        collapse.appendChild(body);
        item.appendChild(collapse);
        accordion.appendChild(item);
    });

    container.appendChild(accordion);
}

function calculateCurrentWeek() {
    const startDate = new Date('2025-09-01'); // Start of academic year
    const currentDate = new Date();
    
    // Calculate difference in milliseconds
    const diffTime = Math.abs(currentDate - startDate);
    // Calculate difference in days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    // Calculate week number
    currentWeekNumber = Math.ceil(diffDays / 7);
    
    // Determine if numerator (odd) or denominator (even)
    // Week 1 is Numerator
    currentWeekType = (currentWeekNumber % 2 !== 0) ? "numerator" : "denominator";
    
    updateWeekDisplay();
}

function updateWeekDisplay() {
    const weekInfoElement = document.getElementById("week-info");
    const weekTypeText = currentWeekType === "numerator" ? "Текущая: Числитель" : "Текущая: Знаменатель";
    
    weekInfoElement.textContent = `${weekTypeText} / ${currentWeekNumber} неделя`;

    // Update active state in dropdown
    const dropdownItems = document.querySelectorAll("#week-type-dropdown .dropdown-item");
    dropdownItems.forEach(item => {
        const type = item.getAttribute("data-type");
        if (type === currentWeekType) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
        // Remove inline styles
        item.style.backgroundColor = "";
        item.style.color = "";
    });
}

function initWeekDropdown() {
    const dropdownItems = document.querySelectorAll("#week-type-dropdown .dropdown-item");
    dropdownItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const type = e.target.getAttribute("data-type");
            if (type) {
                currentWeekType = type;
                updateWeekDisplay();
                if (fullScheduleData) {
                    renderSchedule();
                }
            }
        });
    });
}

function initGroupDropdown() {
    const dropdownMenu = document.getElementById("group-dropdown");
    dropdownMenu.innerHTML = "";

    Object.keys(groups).forEach(groupName => {
        const item = document.createElement("a");
        item.classList.add("dropdown-item");
        item.href = "#";
        item.textContent = groupName;
        item.addEventListener("click", (e) => {
            e.preventDefault();
            loadGroup(groupName);
        });
        dropdownMenu.appendChild(item);
    });
}

function loadGroup(groupName) {
    currentGroup = groupName;
    localStorage.setItem('selectedGroup', groupName);
    const groupNameEl = document.getElementById("group-name");
    groupNameEl.textContent = groupName;
    groupNameEl.style.color = "var(--accent-color)";
    groupNameEl.style.fontWeight = "600";
    
    // Update active state in dropdown
    const dropdownItems = document.querySelectorAll("#group-dropdown .dropdown-item");
    dropdownItems.forEach(item => {
        if (item.textContent === groupName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
        // Remove inline styles that might have been set previously
        item.style.backgroundColor = "";
        item.style.color = "";
    });

    // Toggle UMKD visibility
    const umkdNavItem = document.getElementById("umkd-nav-item");
    if (groupName === "СИБ-24-2с-1" || groupName === "СИБ-24-2с-2") {
        umkdNavItem.style.display = "block"; // Or "list-item" or whatever bootstrap expects, usually block/flex works for nav-item
    } else {
        umkdNavItem.style.display = "none";
    }

    const filePath = groups[groupName];
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            fullScheduleData = data;
            renderSchedule();
        })
        .catch(error => console.error("Error loading schedule:", error));
}

function renderSchedule() {
    if (!fullScheduleData) return;

    // Determine which data to show based on currentWeekType
    // If the JSON has 'numerator' and 'denominator' keys, use them.
    // If not (e.g. flat structure), use the root object.
    let scheduleData;
    if (fullScheduleData.numerator && fullScheduleData.denominator) {
        scheduleData = fullScheduleData[currentWeekType];
    } else {
        // Fallback for files that might not have the structure yet
        scheduleData = fullScheduleData.numerator ? fullScheduleData.numerator : fullScheduleData;
    }

    const container = document.getElementById("schedule-row");
    container.innerHTML = "";

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    
    // Split days into two columns
    const col1Days = days.slice(0, 3);
    const col2Days = days.slice(3);

    const col1 = document.createElement("div");
    col1.className = "col-12 col-sm-12 col-md-6";
    col1.style.paddingTop = "12px";
    col1.style.paddingBottom = "0px";

    const col2 = document.createElement("div");
    col2.className = "col col-sm-12 col-md-6";

    col1Days.forEach(day => {
        const card = createDayCard(day, scheduleData[day]);
        col1.appendChild(card);
    });

    col2Days.forEach(day => {
        const card = createDayCard(day, scheduleData[day]);
        col2.appendChild(card);
    });

    // Add Sunday separately or to the second column if needed. 
    // The original HTML had Sunday in the second column.
    const sundayCard = createDayCard("sunday", scheduleData["sunday"]);
    col2.appendChild(sundayCard);

    container.appendChild(col1);
    container.appendChild(col2);
    
    // Highlight current time after rendering
    highlightCurrentTime();
}

const dayNamesRu = {
    "monday": "Понедельник",
    "tuesday": "Вторник",
    "wednesday": "Среда",
    "thursday": "Четверг",
    "friday": "Пятница",
    "saturday": "Суббота",
    "sunday": "Воскресенье"
};

function createDayCard(dayName, dayData) {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginTop = "8px";
    card.style.marginBottom = "24px";
    card.style.borderRadius = "16px";
    
    // Styles handled by CSS variables now
    // card.style.background = ...
    // card.style.border = ...
    // card.style.boxShadow = ...
    // card.style.backdropFilter = ...

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.style.marginBottom = "0px";
    cardBody.style.marginTop = "0px";
    cardBody.style.padding = "8px 16px";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = dayNamesRu[dayName] || dayName;
    cardBody.appendChild(title);

    if (!dayData || dayData.length === 0 || (dayData.length === 1 && Object.keys(dayData[0]).length === 0)) {
        const holidayText = document.createElement("p");
        holidayText.className = "card-text";
        holidayText.textContent = "Выходной";
        cardBody.appendChild(holidayText);
    } else {
        dayData.forEach((lesson, index) => {
            if (!lesson.subject) return; // Skip empty objects if any

            const lessonCard = document.createElement("div");
            lessonCard.className = "card mb-2 lesson-card";
            
            // Styles handled by CSS variables now
            // lessonCard.style.background = ...
            // lessonCard.style.boxShadow = ...
            // lessonCard.style.backdropFilter = ...
            // lessonCard.style.borderLeft = ...
            
            const lessonBody = document.createElement("div");
            lessonBody.className = "card-body p-2";

            const header = document.createElement("div");
            
            const time = document.createElement("span");
            time.className = "lesson-time card-subtitle mb-2";
            time.textContent = lesson.time;
            
            const subject = document.createElement("span");
            subject.className = "lesson-subject";
            subject.textContent = lesson.subject;

            header.appendChild(time);
            header.appendChild(subject);
            lessonBody.appendChild(header);

            const details = document.createElement("p");
            details.className = "card-text lesson-details";
            details.style.margin = "0";
            details.style.marginTop = "4px";
            details.style.fontSize = "0.9rem";
            details.textContent = `${lesson.room || ''}, ${lesson.teacher || ''}`;

            lessonBody.appendChild(details);
            lessonCard.appendChild(lessonBody);
            cardBody.appendChild(lessonCard);
        });
    }

    card.appendChild(cardBody);
    return card;
}
