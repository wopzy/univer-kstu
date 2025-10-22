let scheduleData = {};

function detectWeekType() {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const septFirst = new Date(year, 8, 1);
  const diff = Math.floor((now - septFirst) / (1000 * 60 * 60 * 24 * 7));
  return diff % 2 === 0 ? "numerator" : "denominator";
}

async function loadSchedule(scheduleFile) {
  try {
    const res = await fetch(scheduleFile);
    if (!res.ok) {
      throw new Error(`Файл расписания не найден: ${scheduleFile}`);
    }
    scheduleData = await res.json();
    const type = detectWeekType();
    document.getElementById("current-week").textContent = "Сейчас: " + (type === "numerator" ? "числитель" : "знаменатель");
    renderSchedule(type);
    highlightTodayAndLesson(type);
  } catch (error) {
    console.error("Не удалось загрузить расписание:", error);
    document.getElementById("schedule-container").innerHTML = `<p style="text-align: center; color: #ff8a8a;">${error.message}</p>`;
  }
}

function renderSchedule(type) {
  const container = document.getElementById("schedule-container");
  const weekLabel = document.getElementById("week-type");
  container.innerHTML = "";
  weekLabel.textContent = "Неделя: " + (type === "numerator" ? "числитель" : "знаменатель");
  const days = scheduleData[type];
  const dayNamesRu = { monday: "Понедельник", tuesday: "Вторник", wednesday: "Среда", thursday: "Четверг", friday: "Пятница", saturday: "Суббота", sunday: "Воскресенье" };
  for (const [day, lessons] of Object.entries(days)) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    const dayTitle = document.createElement("h3");
    dayTitle.textContent = dayNamesRu[day];
    dayDiv.appendChild(dayTitle);
    const ul = document.createElement("ul");
    if (!lessons || lessons.length === 0 || (lessons.length === 1 && Object.keys(lessons[0]).length === 0) ) {
      const li = document.createElement("li");
      li.className = "holiday";
      li.innerHTML = `Выходной<div class="pyro"><div class="before"></div><div class="after"></div></div>`;
      ul.appendChild(li);
    } else {
      lessons.forEach(lesson => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${lesson.time}</strong> — ${lesson.subject} <br><em>${lesson.room}, ${lesson.teacher}</em>`;
        ul.appendChild(li);
      });
    }
    dayDiv.appendChild(ul);
    container.appendChild(dayDiv);
  }
}

function highlightTodayAndLesson(displayedWeekType) {
  document.querySelectorAll(".day").forEach(dayDiv => dayDiv.classList.remove("today"));
  document.querySelectorAll(".day li").forEach(li => li.classList.remove("current-lesson"));
  const actualWeekType = detectWeekType();
  if (actualWeekType !== displayedWeekType) {
    return;
  }
  const now = new Date();
  const dayIndex = now.getDay();
  const daysRu = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
  const currentDayName = daysRu[dayIndex];
  const todayDiv = Array.from(document.querySelectorAll(".day")).find(div => div.querySelector('h3')?.textContent === currentDayName);
  if (todayDiv) {
    todayDiv.classList.add("today");
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const timeToMinutes = timeStr => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    todayDiv.querySelectorAll("li").forEach(li => {
      const timeEl = li.querySelector("strong");
      if (timeEl && timeEl.textContent.includes('–')) {
        const [startStr, endStr] = timeEl.textContent.split('–');
        const startTime = timeToMinutes(startStr.trim());
        const endTime = timeToMinutes(endStr.trim());
        if (currentTimeInMinutes >= startTime && currentTimeInMinutes <= endTime) {
          li.classList.add("current-lesson");
        }
      }
    });
  }
}
  
async function loadUmkd() {
  const container = document.getElementById('umkd-container');
  if (!container) return;
  const currentScheduleFile = localStorage.getItem('selectedSchedule') || 'schedule.json';
  const allowedGroups = ['schedule.json', 'schedule2.json'];
  if (allowedGroups.includes(currentScheduleFile)) {
    container.innerHTML = '<h2>Загрузка данных...</h2>';
    try {
        const response = await fetch('public/umkd.json');
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const data = await response.json();
        if (Object.keys(data).length === 0) { container.innerHTML = '<h2>Предметы еще не добавлены.</h2>'; return; }
        renderSubjects(data, container);
    } catch (error) {
        console.error("Ошибка при загрузке УМКД:", error);
        container.innerHTML = '<h2>Не удалось загрузить данные.</h2>';
    }
  } else {
    container.innerHTML = '<h2>Для вашей группы УМКД еще не загружено.</h2>';
  }
}

function renderSubjects(data, container) {
  container.innerHTML = '';
  const subjectsList = document.createElement('ul');
  subjectsList.className = 'subjects-list';
  for (const subjectName in data) {
      const li = document.createElement('li');
      li.className = 'subject-item';
      li.textContent = subjectName;
      li.addEventListener('click', () => renderFiles(subjectName, data[subjectName], container, data));
      subjectsList.appendChild(li);
  }
  container.appendChild(subjectsList);
}

function renderFiles(subjectName, files, container, allData) {
  container.innerHTML = '';
  const backButton = document.createElement('button');
  backButton.textContent = '← Назад к предметам';
  backButton.className = 'back-button';
  backButton.addEventListener('click', () => renderSubjects(allData, container));
  container.appendChild(backButton);
  const title = document.createElement('h2');
  title.textContent = subjectName;
  container.appendChild(title);
  if (files.length === 0) { container.innerHTML += '<p>Файлов для этого предмета пока нет.</p>'; return; }
  const filesContainer = document.createElement('div');
  filesContainer.className = 'files-container';
  const getFileIcon = (fileName) => {
      const extension = fileName.split('.').pop().toLowerCase();
      switch (extension) {
          case 'pdf': return '📕'; case 'docx': case 'doc': return '📄'; case 'xlsx': case 'xls': return '📊';
          case 'pptx': case 'ppt': return '💻'; case 'zip': case 'rar': return '📦'; default: return '📁';
      }
  };
  files.forEach(file => {
      const filePath = `public/${encodeURIComponent(subjectName)}/${encodeURIComponent(file.name)}`;
      const cardLink = document.createElement('a');
      cardLink.className = 'file-card';
      cardLink.href = filePath;
      cardLink.download = file.name;
      cardLink.innerHTML = `<div class="file-icon">${getFileIcon(file.name)}</div><div class="file-info"><span class="file-name">${file.name}</span><span class="file-meta">${file.type} • ${file.size} • ${file.date}</span></div>`;
      filesContainer.appendChild(cardLink);
  });
  container.appendChild(filesContainer);
}

function updatePageTitle() {
  const selectedRadio = document.querySelector('input[name="group"]:checked');
  if (selectedRadio) {
    const label = document.querySelector(`label[for="${selectedRadio.id}"]`);
    if (label) {
      const groupName = label.textContent.trim();
      
      document.title = `Univer | ${groupName}`;
      
      const pageHeading = document.getElementById('page-heading');
      if (pageHeading) {
        pageHeading.textContent = groupName;
      }
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-btn');
  const menu = document.getElementById('menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => menu.classList.toggle('menu-hidden'));
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
        menu.classList.add('menu-hidden');
      }
    });
  }
  const settingsLink = Array.from(document.querySelectorAll('#menu li a')).find(link => link.textContent.trim() === 'Настройки');
  const settingsModal = document.getElementById('settings-modal');
  if (settingsLink && settingsModal) {
    settingsLink.addEventListener('click', (e) => { e.preventDefault(); settingsModal.classList.remove('hidden'); if (menu) menu.classList.add('menu-hidden'); });
  }
  const closeSettingsBtn = document.getElementById('close-settings');
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.onclick = () => settingsModal.classList.add('hidden');
  }
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
      document.body.className = '';
      if (btn.dataset.theme !== 'default') { document.body.classList.add('theme-' + btn.dataset.theme); }
      if (settingsModal) settingsModal.classList.add('hidden');
      localStorage.setItem('theme', btn.dataset.theme);
    };
  });
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && savedTheme !== 'default') { document.body.classList.add('theme-' + savedTheme); }
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const targetId = item.dataset.target;
      contentSections.forEach(section => {
        if (section.id === targetId) { section.classList.remove('hidden'); } else { section.classList.add('hidden'); }
      });
    });
  });

  const groupRadios = document.querySelectorAll('input[name="group"]');
  const defaultScheduleFile = 'schedule.json';
  const savedScheduleFile = localStorage.getItem('selectedSchedule') || defaultScheduleFile;
  const savedRadio = document.querySelector(`input[value="${savedScheduleFile}"]`);
  if (savedRadio) {
    savedRadio.checked = true;
  }
  
  loadSchedule(savedScheduleFile);
  loadUmkd();
  updatePageTitle(); 
  
  groupRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const newScheduleFile = radio.value;
      localStorage.setItem('selectedSchedule', newScheduleFile);
      loadSchedule(newScheduleFile);
      loadUmkd();
      updatePageTitle(); 
      menu.classList.add('menu-hidden');
    });
  });

  document.getElementById("numerator-btn").addEventListener("click", () => { renderSchedule("numerator"); highlightTodayAndLesson("numerator"); });
  document.getElementById("denominator-btn").addEventListener("click", () => { renderSchedule("denominator"); highlightTodayAndLesson("denominator"); });
});


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}