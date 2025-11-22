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
    calculateCurrentWeek();
    
    const savedGroup = localStorage.getItem('selectedGroup');
    if (savedGroup && groups[savedGroup]) {
        loadGroup(savedGroup);
    } else {
        loadGroup(defaultGroup);
    }
});

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
    const weekTypeText = currentWeekType === "numerator" ? "Числитель" : "Знаменатель";
    
    weekInfoElement.textContent = `${weekTypeText} / ${currentWeekNumber} неделя`;
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
    document.getElementById("group-name").textContent = groupName;
    
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
    card.style.marginTop = "0px";
    card.style.marginBottom = "24px";
    card.style.borderColor = "#2fa4e7";

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
            lessonCard.className = "card mb-2";
            lessonCard.style.border = "1px solid rgba(0,0,0,.125)";
            
            const lessonBody = document.createElement("div");
            lessonBody.className = "card-body p-2";

            const header = document.createElement("div");
            
            const time = document.createElement("span");
            time.className = "text-muted card-subtitle mb-2";
            time.style.marginRight = "8px";
            time.style.fontWeight = "bold";
            time.textContent = lesson.time;
            
            const subject = document.createElement("span");
            subject.style.fontWeight = "500";
            subject.innerHTML = `<span style="color: rgba(73, 80, 87, 0.75);">${lesson.subject}</span>`;

            header.appendChild(time);
            header.appendChild(subject);
            lessonBody.appendChild(header);

            const details = document.createElement("p");
            details.className = "card-text";
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
