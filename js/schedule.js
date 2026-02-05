// Schedule Management
document.addEventListener('DOMContentLoaded', function () {
  // Elements
  const logoutBtn = document.getElementById('logoutBtn');
  const addAppointmentBtn = document.getElementById('addAppointmentBtn');
  const emptyAddBtn = document.getElementById('emptyAddBtn');
  const prevDate = document.getElementById('prevDate');
  const nextDate = document.getElementById('nextDate');
  const datePicker = document.getElementById('datePicker');

  const appointmentModal = document.getElementById('appointmentModal');
  const closeAppointmentModal = document.getElementById('closeAppointmentModal');
  const appointmentForm = document.getElementById('appointmentForm');
  const cancelAppointment = document.getElementById('cancelAppointment');
  const clientExpiryWarning = document.getElementById('clientExpiryWarning');

  const editAppointmentModal = document.getElementById('editAppointmentModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const editAppointmentForm = document.getElementById('editAppointmentForm');
  const cancelEdit = document.getElementById('cancelEdit');
  const deleteAppointment = document.getElementById('deleteAppointment');

  // View toggle elements
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const dayView = document.getElementById('dayView');
  const weekView = document.getElementById('weekView');
  const listView = document.getElementById('listView');
  const therapistView = document.getElementById('therapistView');

  // Day view elements
  const currentDateDisplay = document.getElementById('currentDateDisplay');
  const printSchedule = document.getElementById('printSchedule');
  const exportSchedule = document.getElementById('exportSchedule');
  const timelineContainer = document.querySelector('.timeline-container');

  // Week view elements
  const weekDisplay = document.getElementById('weekDisplay');
  const prevWeek = document.getElementById('prevWeek');
  const thisWeek = document.getElementById('thisWeek');
  const nextWeek = document.getElementById('nextWeek');
  const weekGrid = document.querySelector('.week-grid');

  // List view elements
  const listFilterStatus = document.getElementById('listFilterStatus');
  const listFilterTherapy = document.getElementById('listFilterTherapy');
  const listFilterTherapist = document.getElementById('listFilterTherapist');
  const listSearch = document.getElementById('listSearch');
  const appointmentsList = document.getElementById('appointmentsList');
  const listPagination = document.getElementById('listPagination');

  // Therapist view elements
  const therapistFilter = document.getElementById('therapistFilter');
  const therapistDate = document.getElementById('therapistDate');
  const findAvailableSlots = document.getElementById('findAvailableSlots');
  const therapistGrid = document.getElementById('therapistGrid');
  const availabilitySummary = document.getElementById('availabilitySummary');

  // Stats
  const scheduledCount = document.getElementById('scheduledCount');
  const ongoingCount = document.getElementById('ongoingCount');
  const therapistCount = document.getElementById('therapistCount');
  const conflictCount = document.getElementById('conflictCount');

  // Conflict flash
  const conflictFlash = document.getElementById('conflictFlash');
  const flashClose = document.querySelector('.flash-close');

  // State
  let appointments = [];
  let clients = [];
  let therapists = [];
  let currentDate = new Date();
  let currentWeekStart = new Date();
  let currentView = 'day';
  let currentAppointmentId = null;

  let listPage = 1;
  const itemsPerPage = 10;
  let filteredAppointments = [];

  // Constants
  const DEFAULT_DURATION_MIN = 60;
  const BUSINESS_HOURS_START = 9;
  const BUSINESS_HOURS_END = 17;

  // Init
  initSchedule();

  function initSchedule() {
    loadUserInfo();
    updateDateDisplay();

    loadAppointments();
    loadClients();
    loadTherapists();

    setupEventListeners();
    populateTimeDropdowns();

    switchView('day');
  }

  function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);

    addAppointmentBtn.addEventListener('click', showAddAppointmentModal);
    emptyAddBtn.addEventListener('click', showAddAppointmentModal);

    prevDate.addEventListener('click', () => navigateDate(-1));
    nextDate.addEventListener('click', () => navigateDate(1));
    datePicker.addEventListener('change', handleDateChange);

    closeAppointmentModal.addEventListener('click', () => hideModal(appointmentModal));
    closeEditModal.addEventListener('click', () => hideModal(editAppointmentModal));

    cancelAppointment.addEventListener('click', () => hideModal(appointmentModal));
    cancelEdit.addEventListener('click', () => hideModal(editAppointmentModal));

    appointmentForm.addEventListener('submit', handleSaveAppointment);
    editAppointmentForm.addEventListener('submit', handleUpdateAppointment);

    deleteAppointment.addEventListener('click', handleDeleteAppointment);

    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', function () {
        switchView(this.dataset.view);
      });
    });

    prevWeek.addEventListener('click', () => navigateWeek(-1));
    thisWeek.addEventListener('click', () => navigateWeek(0));
    nextWeek.addEventListener('click', () => navigateWeek(1));

    listFilterStatus.addEventListener('change', () => {
      listPage = 1;
      updateListView();
    });
    listFilterTherapy.addEventListener('change', () => {
      listPage = 1;
      updateListView();
    });
    listFilterTherapist.addEventListener('change', () => {
      listPage = 1;
      updateListView();
    });
    listSearch.addEventListener('input', () => {
      listPage = 1;
      updateListView();
    });

    therapistFilter.addEventListener('change', updateTherapistView);
    therapistDate.addEventListener('change', updateTherapistView);
    findAvailableSlots.addEventListener('click', findAvailableTimeSlots);

    printSchedule.addEventListener('click', () => window.print());
    exportSchedule.addEventListener('click', handleExport);

    flashClose.addEventListener('click', () => conflictFlash.classList.remove('show'));

    // Client expiry check on selection
    const clientSelect = document.getElementById('appointmentClient');
    clientSelect.addEventListener('change', checkClientExpiry);

    // Navigation
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', function () {
        const page = this.dataset.page;
        if (page !== 'schedule') window.location.href = `${page}.html`;
      });
    });

    // Close modals when click outside
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('modal-overlay')) {
        hideModal(appointmentModal);
        hideModal(editAppointmentModal);
      }
    });

    // Auto-refresh
    setInterval(() => {
      updateStats();
      if (currentView === 'day') updateDayView();
      if (currentView === 'therapist') updateTherapistView();
    }, 60 * 1000);

    setInterval(() => {
      loadAppointments();
      loadTherapists();
    }, 5 * 60 * 1000);
  }

  // ---------- Date and Time Helpers ----------
  function formatDateForDisplay(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseInputDate(dateStr) {
    const parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function toHHMMSS(timeStr) {
    if (!timeStr) return '00:00:00';
    if (timeStr.length === 5) return `${timeStr}:00`;
    return timeStr;
  }

  function fromHHMMSS(timeStr) {
    if (!timeStr) return '00:00';
    return timeStr.substring(0, 5);
  }

  function getDayNameFromDate(dateStr) {
    const date = parseInputDate(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // ---------- Load Data ----------
  async function loadUserInfo() {
    try {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
        document.getElementById('adminName').textContent = name;
        document.getElementById('adminEmail').textContent = user.email;
      }
    } catch (e) {
      console.error('Error loading user info:', e);
    }
  }

  async function loadAppointments() {
    Utils.showLoading(true, 'Loading appointments...');
    try {
const { data, error } = await window.supabaseClient
  .from('schedules')
  .select(`
    id, client_id, therapist_id, day, timeslot, date, status, notes, created_at,
    clients!inner (id, name, therapy_type, expires_at),
    therapists!inner (id, name, department)  // ← ONLY department
  `)
        .order('date', { ascending: true })
        .order('timeslot', { ascending: true });

      if (error) throw error;

      appointments = data || [];
      filteredAppointments = [...appointments];

      updateStats();
      updateDayView();
      updateWeekView();
      updateListView();
      populateTherapyFilter();
      populateTherapistFilter();
    } catch (e) {
      console.error('Error loading appointments:', e);
      Utils.showNotification(e?.message || 'Failed to load appointments', 'error');
    } finally {
      Utils.showLoading(false);
    }
  }

  async function loadClients() {
  try {
    const { data, error } = await window.supabaseClient
      .from('clients')
      .select('id, name, therapy_type, expires_at, therapist_id') // ← ADD therapist_id
      .order('name');

    if (error) throw error;
    clients = data || [];
    populateClientDropdown();
  } catch (e) {
    console.error('Error loading clients:', e);
  }
}

  async function loadTherapists() {
    try {
      const { data, error } = await window.supabaseClient
        .from('therapists')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      therapists = data || [];
      updateTherapistAvailability();
      populateTherapistDropdowns();
      populateTherapistViewFilter();
      updateTherapistView();
    } catch (e) {
      console.error('Error loading therapists:', e);
    }
  }

  // ---------- Client Expiry Check ----------
  function isClientExpired(expiresAt) {
    if (!expiresAt) return false;
    const today = new Date();
    const expiryDate = new Date(expiresAt);
    return expiryDate < today;
  }

  function isClientExpiringSoon(expiresAt) {
    if (!expiresAt) return false;
    const today = new Date();
    const expiryDate = new Date(expiresAt);
    const daysDiff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7 && daysDiff >= 0;
  }

  function checkClientExpiry() {
    const clientId = document.getElementById('appointmentClient').value;
    if (!clientId) {
      clientExpiryWarning.style.display = 'none';
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) {
      clientExpiryWarning.style.display = 'none';
      return;
    }

    const isExpired = isClientExpired(client.expires_at);
    const isExpiringSoon = isClientExpiringSoon(client.expires_at);

    if (isExpired || isExpiringSoon) {
      clientExpiryWarning.style.display = 'block';
      if (isExpired) {
        clientExpiryWarning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> This client\'s subscription has expired!';
        clientExpiryWarning.style.background = 'rgba(239, 68, 68, 0.1)';
        clientExpiryWarning.style.color = '#ef4444';
      } else {
        const expiryDate = new Date(client.expires_at);
        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        clientExpiryWarning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> This client\'s subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
        clientExpiryWarning.style.background = 'rgba(245, 158, 11, 0.1)';
        clientExpiryWarning.style.color = '#f59e0b';
      }
    } else {
      clientExpiryWarning.style.display = 'none';
    }
  }

  // ---------- Stats ----------
  function updateStats() {
    const today = formatDateForInput(new Date());
    const now = new Date();

    const scheduledToday = appointments.filter((apt) =>
      apt.date === today && apt.status === 'scheduled'
    ).length;
    scheduledCount.textContent = scheduledToday;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const ongoingNow = appointments.filter((apt) => {
      if (apt.date !== today || apt.status !== 'scheduled') return false;

      const timeStr = fromHHMMSS(apt.timeslot);
      const [h, m] = timeStr.split(':').map(Number);
      const start = h * 60 + m;

      return currentTime >= start && currentTime < start + DEFAULT_DURATION_MIN;
    }).length;
    ongoingCount.textContent = ongoingNow;

    updateTherapistAvailability();
    checkConflicts();
  }

  function updateTherapistAvailability() {
    const today = formatDateForInput(new Date());
    const available = therapists.filter((t) => {
      if (!t.is_active) return false;
      if (t.leave_dates && t.leave_dates.length) {
        const todayDate = parseInputDate(today);
        const isOnLeave = t.leave_dates.some((leave) => {
          const from = new Date(leave.from);
          const to = new Date(leave.to);
          return todayDate >= from && todayDate <= to;
        });
        if (isOnLeave) return false;
      }
      return true;
    }).length;

    therapistCount.textContent = available;
  }

  function checkConflicts() {
    const conflicts = [];
    const map = {};

    appointments.forEach((apt) => {
      if (apt.status === 'cancelled') return;
      const key = `${apt.therapist_id}-${apt.date}`;
      map[key] = map[key] || [];
      map[key].push(apt);
    });

    Object.values(map).forEach((arr) => {
      arr.sort((a, b) => {
        const at = fromHHMMSS(a.timeslot);
        const bt = fromHHMMSS(b.timeslot);
        const [ah, am] = at.split(':').map(Number);
        const [bh, bm] = bt.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      });

      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1];
        const cur = arr[i];

        const pt = fromHHMMSS(prev.timeslot);
        const ct = fromHHMMSS(cur.timeslot);

        const [ph, pm] = pt.split(':').map(Number);
        const [ch, cm] = ct.split(':').map(Number);

        const prevEnd = ph * 60 + pm + DEFAULT_DURATION_MIN;
        const curStart = ch * 60 + cm;

        if (curStart < prevEnd) {
          conflicts.push({ appointment1: prev, appointment2: cur });
        }
      }
    });

    conflictCount.textContent = conflicts.length;
    if (conflicts.length > 0) showConflictFlash(conflicts.length);
    return conflicts;
  }

  function showConflictFlash(count) {
    const msg = conflictFlash.querySelector('.flash-message');
    msg.textContent = `${count} schedule conflict${count !== 1 ? 's' : ''} detected!`;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    conflictFlash.classList.add('show');
    setTimeout(() => conflictFlash.classList.remove('show'), 5000);
  }

  // ---------- Date Navigation ----------
  function updateDateDisplay() {
    currentDateDisplay.textContent = formatDateForDisplay(currentDate);
    datePicker.value = formatDateForInput(currentDate);
    therapistDate.value = formatDateForInput(new Date());
  }

  function navigateDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateDateDisplay();
    updateDayView();
  }

  function handleDateChange() {
    currentDate = parseInputDate(datePicker.value);
    updateDateDisplay();
    updateDayView();
  }

  function switchView(view) {
    toggleBtns.forEach((b) => b.classList.remove('active'));
    document.querySelector(`.toggle-btn[data-view="${view}"]`)?.classList.add('active');

    dayView.classList.remove('active');
    weekView.classList.remove('active');
    listView.classList.remove('active');
    therapistView.classList.remove('active');

    document.getElementById(`${view}View`)?.classList.add('active');

    currentView = view;
    if (view === 'day') updateDayView();
    if (view === 'week') updateWeekView();
    if (view === 'list') updateListView();
    if (view === 'therapist') updateTherapistView();
  }

  // ---------- Time Dropdown ----------
  function populateTimeDropdowns() {
    const timeSelect = document.getElementById('appointmentTime');
    const editTimeSelect = document.getElementById('editTime');

    while (timeSelect.options.length > 1) timeSelect.remove(1);
    while (editTimeSelect.options.length > 1) editTimeSelect.remove(1);

    for (let hour = BUSINESS_HOURS_START; hour < BUSINESS_HOURS_END; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const timeDisplay = Utils.formatTime(time24);
        const timeValue = toHHMMSS(time24);

        const option1 = document.createElement('option');
        option1.value = timeValue;
        option1.textContent = timeDisplay;

        const option2 = option1.cloneNode(true);

        timeSelect.appendChild(option1);
        editTimeSelect.appendChild(option2);
      }
    }
  }

// ---------- Day View ----------
function updateDayView() {
  const dateStr = formatDateForInput(currentDate);

  const dayAppointments = appointments
    .filter((apt) => apt.date === dateStr && apt.status !== 'cancelled')
    .sort((a, b) => {
      const timeA = fromHHMMSS(a.timeslot);
      const timeB = fromHHMMSS(b.timeslot);
      const [ah, am] = timeA.split(':').map(Number);
      const [bh, bm] = timeB.split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });

  if (dayAppointments.length === 0) {
    timelineContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <h3>No Appointments Today</h3>
        <p>Schedule appointments to see them here</p>
        <button class="btn-primary btn-3d" id="emptyAddBtn2">
          <i class="fas fa-calendar-plus"></i>
          Add Appointment
        </button>
      </div>
    `;
    document.getElementById('emptyAddBtn2')?.addEventListener('click', showAddAppointmentModal);
    return;
  }

  // Conflicts
  const conflicts = checkConflicts();
  const conflictIds = new Set();
  conflicts.forEach((c) => {
    conflictIds.add(c.appointment1.id);
    conflictIds.add(c.appointment2.id);
  });

  // Group appointments by exact time (HH:MM)
  const timeGroups = {};
  dayAppointments.forEach((apt) => {
    const timeKey = fromHHMMSS(apt.timeslot); // "09:15"
    timeGroups[timeKey] = timeGroups[timeKey] || [];
    timeGroups[timeKey].push(apt);
  });

  const timesSorted = Object.keys(timeGroups).sort((a, b) => {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return (ah * 60 + am) - (bh * 60 + bm);
  });

  // Build a dynamic "time list" day view
  let html = `
    <div class="day-timeline-list">
  `;

  timesSorted.forEach((timeKey) => {
    const timeLabel = Utils.formatTime(timeKey);
    const group = timeGroups[timeKey];

    html += `
      <div class="day-row">
        <div class="day-time">${timeLabel}</div>
        <div class="day-cards">
    `;

    group.forEach((apt) => {
      const isConflict = conflictIds.has(apt.id);
      const therapyType = apt.therapists?.department || 'General';

      html += `
        <div class="appointment-slot ${isConflict ? 'conflict' : ''}"
             data-id="${apt.id}"
             data-time="${Utils.formatTime(timeKey)}"
             data-status="${calculateTimeStatus(timeKey, apt.date)}">
          <div class="appointment-content">
            <div class="client-name">${apt.clients?.name || 'Unknown'}</div>
            <div class="therapist-name">${apt.therapists?.name || 'Unknown'}</div>
            <div class="appointment-time">${Utils.formatTime(timeKey)}</div>
            <div class="therapy-type">${therapyType}</div>
            ${isConflict ? '<small style="color:#ffb4b4;">CONFLICT!</small>' : ''}
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `</div>`;
  timelineContainer.innerHTML = html;

  // After rendering, mark next-gap (same logic you had, but works on list view now)
  if (dayAppointments.length > 1) {
    const therapistGroups = {};
    dayAppointments.forEach((apt) => {
      if (!therapistGroups[apt.therapist_id]) therapistGroups[apt.therapist_id] = [];
      therapistGroups[apt.therapist_id].push(apt);
    });

    Object.values(therapistGroups).forEach((apts) => {
      apts.sort((a, b) => {
        const timeA = fromHHMMSS(a.timeslot);
        const timeB = fromHHMMSS(b.timeslot);
        const [ah, am] = timeA.split(':').map(Number);
        const [bh, bm] = timeB.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      });

      for (let i = 0; i < apts.length - 1; i++) {
        const timeA = fromHHMMSS(apts[i].timeslot);
        const timeB = fromHHMMSS(apts[i + 1].timeslot);
        const [ah, am] = timeA.split(':').map(Number);
        const [bh, bm] = timeB.split(':').map(Number);

        const diff = (bh * 60 + bm) - (ah * 60 + am + DEFAULT_DURATION_MIN);

        if (diff >= 60) {
          const nextSlot = document.querySelector(`.appointment-slot[data-id="${apts[i + 1].id}"]`);
          if (nextSlot) nextSlot.setAttribute('data-status', 'next-gap');
        }
      }
    });
  }

  // Click handlers
  document.querySelectorAll('.appointment-slot').forEach((slot) => {
    slot.addEventListener('click', function () {
      editAppointment(this.dataset.id);
    });
  });
}

  function calculateTimeStatus(timeStr, dateStr) {
    const now = new Date();
    const appointmentDate = parseInputDate(dateStr);
    const today = formatDateForInput(now);
    
    // If appointment is not today, it's upcoming
    if (dateStr !== today) return "upcoming";
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const appointmentTime = hours * 60 + minutes;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Appointment has passed (more than 1 hour ago)
    if (appointmentTime < currentTime - 60) return "past";
    
    // Appointment is currently happening or within the last hour
    if (appointmentTime <= currentTime && currentTime <= appointmentTime + 60) return "current";
    
    // Appointment is upcoming
    return "upcoming";
}

  // ---------- Week View ----------
  function updateWeekView() {
    const weekStart = new Date(currentWeekStart);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diff);

    const weekNumber = getWeekNumber(weekStart);
    weekDisplay.textContent = `Week ${weekNumber}, ${weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

    const conflicts = checkConflicts();
    const conflictIds = new Set();
    conflicts.forEach((c) => {
      conflictIds.add(c.appointment1.id);
      conflictIds.add(c.appointment2.id);
    });

    let html = '';
    const today = formatDateForInput(new Date());

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dateStr = formatDateForInput(dayDate);

      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = dayDate.getDate();

      const dayAppointments = appointments.filter((apt) => 
        apt.date === dateStr && apt.status !== 'cancelled'
      ).sort((a, b) => {
        const timeA = fromHHMMSS(a.timeslot);
        const timeB = fromHHMMSS(b.timeslot);
        const [ah, am] = timeA.split(':').map(Number);
        const [bh, bm] = timeB.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      });

      html += `
        <div class="week-day ${dateStr === today ? 'today' : ''}">
          <div class="week-day-header">
            <div class="week-day-name">${dayName}</div>
            <div class="week-day-date">${dayNumber}</div>
          </div>
          <div class="week-appointments">
      `;

      if (dayAppointments.length === 0) {
        html += `
          <div class="empty-state" style="padding:1rem;">
            <i class="fas fa-calendar-times" style="font-size:1.5rem;"></i>
            <p style="font-size:0.8rem;">No appointments</p>
          </div>
        `;
      } else {
        dayAppointments.forEach((apt) => {
          const isConflict = conflictIds.has(apt.id);
          const timeStr = fromHHMMSS(apt.timeslot);
        const therapyType = apt.therapists?.department || 'General';

          html += `
            <div class="week-appointment ${isConflict ? 'conflict' : ''}" data-id="${apt.id}">
              <div class="week-appointment-time">${Utils.formatTime(timeStr)}</div>
              <div class="week-appointment-client">${apt.clients?.name || 'Unknown'}</div>
              <div class="week-appointment-therapy">${therapyType}</div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    }

    weekGrid.innerHTML = html;

    document.querySelectorAll('.week-appointment').forEach((apt) => {
      apt.addEventListener('click', function () {
        editAppointment(this.dataset.id);
      });
    });
  }

  // ---------- List View ----------
  function updateListView() {
    const statusFilter = listFilterStatus.value;
    const therapyFilter = listFilterTherapy.value;
    const therapistFilter = listFilterTherapist.value;
    const searchTerm = listSearch.value.toLowerCase().trim();

    filteredAppointments = appointments.filter((apt) => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      
      if (therapyFilter !== 'all') {
        const therapyType = apt.therapists?.department || '';
        if (therapyType !== therapyFilter) return false;
      }
      
      if (therapistFilter !== 'all' && apt.therapist_id !== therapistFilter) return false;
      
      if (searchTerm) {
        const clientName = apt.clients?.name?.toLowerCase() || '';
        const therapistName = apt.therapists?.name?.toLowerCase() || '';
       const therapyType = (apt.therapists?.department || '').toLowerCase();
        const notes = apt.notes?.toLowerCase() || '';
        if (!clientName.includes(searchTerm) && 
            !therapistName.includes(searchTerm) && 
            !therapyType.includes(searchTerm) &&
            !notes.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });

    renderListPage();
    updateListPagination();
  }

  function renderListPage() {
    const startIndex = (listPage - 1) * itemsPerPage;
    const pageAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

    if (pageAppointments.length === 0) {
      appointmentsList.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:3rem;">
            <div class="empty-state">
              <i class="fas fa-calendar-times"></i>
              <p>No appointments found</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    pageAppointments.forEach((apt) => {
      const timeStr = fromHHMMSS(apt.timeslot);
    const therapyType = apt.therapists?.department || 'General';

      html += `
        <tr data-id="${apt.id}">
          <td>
            <div>${Utils.formatDate(apt.date)}</div>
            <small>${Utils.formatTime(timeStr)}</small>
          </td>
          <td>${apt.clients?.name || 'Unknown'}</td>
          <td>${apt.therapists?.name || 'Unknown'}</td>
          <td>${therapyType}</td>
          <td><span class="status-badge ${apt.status}">${Utils.capitalize(apt.status || '')}</span></td>
          <td>
            <div class="list-actions">
              <button class="list-action-btn edit" data-id="${apt.id}" title="Edit"><i class="fas fa-edit"></i></button>
              <button class="list-action-btn delete" data-id="${apt.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    appointmentsList.innerHTML = html;

    document.querySelectorAll('.list-action-btn.edit').forEach((btn) => {
      btn.addEventListener('click', function () {
        editAppointment(this.dataset.id);
      });
    });

    document.querySelectorAll('.list-action-btn.delete').forEach((btn) => {
      btn.addEventListener('click', function () {
        deleteAppointmentFromList(this.dataset.id);
      });
    });
  }

  function updateListPagination() {
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    if (totalPages <= 1) {
      listPagination.innerHTML = '';
      return;
    }

    let html = `
      <button class="pagination-btn prev" ${listPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, listPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="pagination-btn ${i === listPage ? 'active' : ''}">${i}</button>`;
    }

    html += `
      <button class="pagination-btn next" ${listPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    listPagination.innerHTML = html;

    document.querySelectorAll('.pagination-btn').forEach((btn) => {
      if (btn.classList.contains('prev')) {
        btn.addEventListener('click', () => {
          if (listPage > 1) {
            listPage--;
            renderListPage();
            updateListPagination();
          }
        });
      } else if (btn.classList.contains('next')) {
        btn.addEventListener('click', () => {
          if (listPage < totalPages) {
            listPage++;
            renderListPage();
            updateListPagination();
          }
        });
      } else if (!btn.classList.contains('active')) {
        btn.addEventListener('click', () => {
          listPage = parseInt(btn.textContent, 10);
          renderListPage();
          updateListPagination();
        });
      }
    });
  }

  function populateTherapyFilter() {
    const select = listFilterTherapy;
    while (select.options.length > 1) select.remove(1);

    // Get unique therapy types from therapists
    const therapyTypes = new Set();
    therapists.forEach((t) => {
  const therapy = t.department;
      if (therapy) therapyTypes.add(therapy);
    });

    // Also check from appointments for any missing types
    appointments.forEach((apt) => {
      const therapy = apt.therapists?.department;
      if (therapy) therapyTypes.add(therapy);
    });

    Array.from(therapyTypes).sort().forEach((therapy) => {
      const option = document.createElement('option');
      option.value = therapy;
      option.textContent = therapy;
      select.appendChild(option);
    });
  }

  function populateTherapistFilter() {
    const select = listFilterTherapist;
    while (select.options.length > 1) select.remove(1);

    therapists.forEach((t) => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = t.name;
      select.appendChild(option);
    });
  }

  function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  function navigateWeek(weeks) {
    if (weeks === 0) {
      currentWeekStart = new Date();
    } else {
      currentWeekStart.setDate(currentWeekStart.getDate() + (weeks * 7));
    }
    updateWeekView();
  }

  // ---------- Therapist View ----------
  function populateTherapistViewFilter() {
    const select = therapistFilter;
    while (select.options.length > 1) select.remove(1);

    therapists.forEach((t) => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = t.name;
      select.appendChild(option);
    });
  }

  function updateTherapistView() {
    const selectedTherapistId = therapistFilter.value;
    const selectedDate = therapistDate.value || formatDateForInput(new Date());
    
    let filteredTherapists = therapists;
    if (selectedTherapistId !== 'all') {
      filteredTherapists = therapists.filter(t => t.id === selectedTherapistId);
    }

    if (filteredTherapists.length === 0) {
      therapistGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-md"></i>
          <h3>No Therapist Data Available</h3>
          <p>Add therapists to see their schedules</p>
        </div>
      `;
      availabilitySummary.innerHTML = '';
      return;
    }

    let html = '';
    let totalFreeSlots = 0;
    let totalBusySlots = 0;
    let availableTherapists = 0;

    filteredTherapists.forEach((therapist) => {
    const therapyType = therapist.department || 'General';
      
      // Get appointments for this therapist on selected date
      const therapistAppointments = appointments.filter((apt) => 
        apt.therapist_id === therapist.id && 
        apt.date === selectedDate && 
        apt.status === 'scheduled'
      ).sort((a, b) => {
        const timeA = fromHHMMSS(a.timeslot);
        const timeB = fromHHMMSS(b.timeslot);
        const [ah, am] = timeA.split(':').map(Number);
        const [bh, bm] = timeB.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      });

      // Check if therapist is on leave
      const isOnLeave = therapist.leave_dates && therapist.leave_dates.some((leave) => {
        const leaveDate = new Date(selectedDate);
        const from = new Date(leave.from);
        const to = new Date(leave.to);
        return leaveDate >= from && leaveDate <= to;
      });

      // Calculate busy time slots
      const busySlots = new Set();
      therapistAppointments.forEach((apt) => {
        const timeStr = fromHHMMSS(apt.timeslot);
        const [h, m] = timeStr.split(':').map(Number);
        const startMinutes = h * 60 + m;
        
        // Mark 1-hour slot as busy
        for (let min = startMinutes; min < startMinutes + DEFAULT_DURATION_MIN; min += 15) {
          const slotHour = Math.floor(min / 60);
          const slotMinute = min % 60;
          const slotTime = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;
          busySlots.add(slotTime);
        }
      });

      // Generate time slots
      const timeSlots = [];
      for (let hour = BUSINESS_HOURS_START; hour < BUSINESS_HOURS_END; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          const isBusy = busySlots.has(time24);
          timeSlots.push({ time: time24, busy: isBusy });
          if (isBusy) totalBusySlots++;
          else totalFreeSlots++;
        }
      }

      // Check current availability
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const selectedDateObj = parseInputDate(selectedDate);
      const isToday = selectedDate === formatDateForInput(new Date());
      let status = 'available';
      let statusText = 'Available';
      let statusClass = 'status-available';

      if (isOnLeave) {
        status = 'off';
        statusText = 'On Leave';
        statusClass = 'status-off';
      } else if (isToday) {
        // Check if currently in a busy slot
        const isCurrentlyBusy = Array.from(busySlots).some((slot) => {
          const [h, m] = slot.split(':').map(Number);
          const slotStart = h * 60 + m;
          return currentTime >= slotStart && currentTime < slotStart + DEFAULT_DURATION_MIN;
        });
        
        if (isCurrentlyBusy) {
          status = 'busy';
          statusText = 'In Session';
          statusClass = 'status-busy';
        }
      }

      if (status === 'available') availableTherapists++;

      html += `
        <div class="therapist-schedule" data-therapist-id="${therapist.id}">
          <div class="therapist-header">
            <div class="therapist-info">
              <div class="therapist-avatar">
                <i class="fas fa-user-md"></i>
              </div>
              <div class="therapist-details">
                <h4>${therapist.name}</h4>
                <p>${therapyType} • ${therapist.qualification || 'Certified Therapist'}</p>
              </div>
            </div>
            <div class="therapist-status ${statusClass}">
              <i class="fas fa-circle"></i>
              ${statusText}
            </div>
          </div>
          
          <div class="timeline-grid">
      `;

      timeSlots.forEach((slot) => {
        const isCurrent = isToday && slot.time === `${String(Math.floor(currentTime/60)).padStart(2, '0')}:${String(Math.floor(currentTime/15)*15%60).padStart(2, '0')}`;
        const cellClass = slot.busy ? 'busy' : 'free';
        const currentClass = isCurrent ? 'current' : '';
        
        html += `
          <div class="time-slot-cell ${cellClass} ${currentClass}" 
               data-time="${slot.time}" 
               data-therapist-id="${therapist.id}"
               title="${slot.busy ? 'Busy' : 'Available'} at ${Utils.formatTime(slot.time)}">
            <div class="time">${Utils.formatTime(slot.time)}</div>
            <div class="status">${slot.busy ? 'Busy' : 'Free'}</div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    therapistGrid.innerHTML = html;

    // Add click handlers for free slots
    document.querySelectorAll('.time-slot-cell.free').forEach((cell) => {
      cell.addEventListener('click', function () {
        const therapistId = this.dataset.therapistId;
        const time = this.dataset.time;
        scheduleFromTherapistView(therapistId, selectedDate, time);
      });
    });

    // Update availability summary
    updateAvailabilitySummary(totalFreeSlots, totalBusySlots, availableTherapists, filteredTherapists.length);
  }

  function updateAvailabilitySummary(freeSlots, busySlots, availableTherapists, totalTherapists) {
    const availabilityPercentage = totalTherapists > 0 ? Math.round((availableTherapists / totalTherapists) * 100) : 0;
    const freePercentage = (freeSlots + busySlots) > 0 ? Math.round((freeSlots / (freeSlots + busySlots)) * 100) : 0;

    availabilitySummary.innerHTML = `
      <div class="summary-card">
        <div class="summary-icon" style="background: linear-gradient(135deg, var(--success-color), #059669);">
          <i class="fas fa-user-check"></i>
        </div>
        <div class="summary-info">
          <h4>${availableTherapists}/${totalTherapists}</h4>
          <p>Therapists Available (${availabilityPercentage}%)</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-icon" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));">
          <i class="fas fa-clock"></i>
        </div>
        <div class="summary-info">
          <h4>${freeSlots}</h4>
          <p>Free Time Slots (${freePercentage}%)</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-icon" style="background: linear-gradient(135deg, var(--warning-color), #d97706);">
          <i class="fas fa-calendar-times"></i>
        </div>
        <div class="summary-info">
          <h4>${busySlots}</h4>
          <p>Busy Time Slots</p>
        </div>
      </div>
    `;
  }

  function findAvailableTimeSlots() {
    const selectedDate = therapistDate.value || formatDateForInput(new Date());
    const selectedTherapistId = therapistFilter.value;
    
    if (selectedTherapistId === 'all') {
      Utils.showNotification('Please select a specific therapist to find available slots', 'warning');
      return;
    }

    const therapist = therapists.find(t => t.id === selectedTherapistId);
    if (!therapist) {
      Utils.showNotification('Therapist not found', 'error');
      return;
    }

    // Get appointments for selected therapist and date
    const therapistAppointments = appointments.filter((apt) => 
      apt.therapist_id === selectedTherapistId && 
      apt.date === selectedDate && 
      apt.status === 'scheduled'
    ).sort((a, b) => {
      const timeA = fromHHMMSS(a.timeslot);
      const timeB = fromHHMMSS(b.timeslot);
      const [ah, am] = timeA.split(':').map(Number);
      const [bh, bm] = timeB.split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });

    // Calculate busy time slots
    const busySlots = new Set();
    therapistAppointments.forEach((apt) => {
      const timeStr = fromHHMMSS(apt.timeslot);
      const [h, m] = timeStr.split(':').map(Number);
      const startMinutes = h * 60 + m;
      
      for (let min = startMinutes; min < startMinutes + DEFAULT_DURATION_MIN; min += 15) {
        const slotHour = Math.floor(min / 60);
        const slotMinute = min % 60;
        const slotTime = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;
        busySlots.add(slotTime);
      }
    });

    // Find available slots
    const availableSlots = [];
    for (let hour = BUSINESS_HOURS_START; hour < BUSINESS_HOURS_END; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        if (!busySlots.has(time24)) {
          availableSlots.push(time24);
        }
      }
    }

    if (availableSlots.length === 0) {
      Utils.showNotification(`No available slots found for ${therapist.name} on ${selectedDate}`, 'warning');
      return;
    }

    // Show available slots
    const slotsText = availableSlots.slice(0, 5).map(slot => Utils.formatTime(slot)).join(', ');
    const extraSlots = availableSlots.length > 5 ? ` and ${availableSlots.length - 5} more` : '';
    
    Utils.showNotification(
      `Available slots for ${therapist.name}: ${slotsText}${extraSlots}`,
      'success'
    );

    // Highlight available slots in the view
    document.querySelectorAll('.time-slot-cell').forEach((cell) => {
      cell.classList.remove('highlight');
      if (availableSlots.includes(cell.dataset.time)) {
        cell.classList.add('highlight');
        cell.style.animation = 'pulse 1.5s infinite';
      }
    });

    // Remove highlight after 5 seconds
    setTimeout(() => {
      document.querySelectorAll('.time-slot-cell').forEach((cell) => {
        cell.classList.remove('highlight');
        cell.style.animation = '';
      });
    }, 5000);
  }

  function scheduleFromTherapistView(therapistId, date, time) {
    showAddAppointmentModal();
    
    // Pre-fill the form
    setTimeout(() => {
      document.getElementById('appointmentTherapist').value = therapistId;
      document.getElementById('appointmentDate').value = date;
      document.getElementById('appointmentTime').value = toHHMMSS(time);
      
      // Trigger change events
      document.getElementById('appointmentTherapist').dispatchEvent(new Event('change'));
      document.getElementById('appointmentDate').dispatchEvent(new Event('change'));
    }, 100);
  }

  // ---------- Dropdown Population ----------
  function populateClientDropdown() {
    const select = document.getElementById('appointmentClient');
    while (select.options.length > 1) select.remove(1);

    const today = new Date();

    clients.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      
      let displayName = c.name;
      if (c.expires_at) {
        const expiryDate = new Date(c.expires_at);
        if (expiryDate < today) {
          displayName += ' (Expired)';
          opt.classList.add('client-expired');
        } else {
          const daysDiff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 7) {
            displayName += ` (Expires in ${daysDiff} day${daysDiff !== 1 ? 's' : ''})`;
            opt.classList.add('client-expiring-soon');
          }
        }
      }
      
      opt.textContent = displayName;
      select.appendChild(opt);
    });
  }

  function populateTherapistDropdowns() {
    const s1 = document.getElementById('appointmentTherapist');
    const s2 = document.getElementById('editTherapist');

    [s1, s2].forEach((s) => {
      while (s.options.length > 1) s.remove(1);
    });

    therapists.forEach((t) => {
     const therapyType = t.department || 'General';
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} (${therapyType})`;

      s1.appendChild(opt.cloneNode(true));
      s2.appendChild(opt.cloneNode(true));
    });
  }

  // ---------- Modals ----------
  function showAddAppointmentModal() {
    appointmentForm.reset();
    clientExpiryWarning.style.display = 'none';

    const dateStr = formatDateForInput(currentDate);
    document.getElementById('appointmentDate').value = dateStr;

    const conflictCheck = document.getElementById('conflictCheck');
    conflictCheck.classList.remove('show', 'warning', 'error', 'success');
    conflictCheck.innerHTML = '';

    showModal(appointmentModal);
  }

async function handleSaveAppointment(e) {
  e.preventDefault();

  const clientId = document.getElementById('appointmentClient').value;
  const therapistId = document.getElementById('appointmentTherapist').value;
  const dateStr = document.getElementById('appointmentDate').value;
  const timeStr = document.getElementById('appointmentTime').value;

  // Check if client is expired
  const client = clients.find(c => c.id === clientId);
  if (client && isClientExpired(client.expires_at)) {
    Utils.showNotification('Cannot schedule appointment for expired client', 'error');
    return;
  }

  // Get therapist
  const therapist = therapists.find(t => t.id === therapistId);
  if (!therapist) {
    Utils.showNotification('Therapist not found', 'error');
    return;
  }

  // Check if therapist is on leave on selected date
  if (therapist.leave_dates && therapist.leave_dates.length > 0) {
    const appointmentDate = new Date(dateStr);
    
    const isOnLeave = therapist.leave_dates.some((leave) => {
      const from = new Date(leave.from);
      const to = new Date(leave.to);
      return appointmentDate >= from && appointmentDate <= to;
    });

    if (isOnLeave) {
      Utils.showNotification(`Therapist ${therapist.name} is on leave on ${dateStr}. Please select another date or therapist.`, 'error');
      return;
    }
  }

  // Get therapist's department
  const therapistDepartment = therapist.department || 'General';

  const appointmentData = {
    client_id: clientId || null,
    therapist_id: therapistId || null,
    date: dateStr,
    day: getDayNameFromDate(dateStr),
    timeslot: toHHMMSS(timeStr),
    notes: (document.getElementById('appointmentNotes')?.value || '').trim() || null,
    status: 'scheduled'
  };

  if (!appointmentData.client_id || !appointmentData.therapist_id || !appointmentData.date || !appointmentData.timeslot) {
    Utils.showNotification('Please fill in all required fields', 'error');
    return;
  }

  const conflict = await checkAppointmentConflict(appointmentData);
  if (conflict) {
    showConflictWarning(conflict);
    return;
  }

  Utils.showLoading(true, 'Scheduling appointment...');

  try {
    // FIRST: Update client with therapist_id AND therapy_type
    const { error: clientUpdateError } = await window.supabaseClient
      .from('clients')
      .update({ 
        therapist_id: therapistId,
        therapy_type: therapistDepartment,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (clientUpdateError) throw clientUpdateError;

    // SECOND: Create the appointment
    const { data, error: appointmentError } = await window.supabaseClient
      .from('schedules')
      .insert([appointmentData])
      .select(`
        id, client_id, therapist_id, day, timeslot, date, status, notes, created_at,
        clients!inner (id, name, therapy_type, expires_at),
        therapists!inner (id, name, department)
      `)
      .single();

    if (appointmentError) throw appointmentError;

    // Update local state
    appointments.push(data);
    
    // Also update the client in local state
    const clientIndex = clients.findIndex(c => c.id === clientId);
    if (clientIndex !== -1) {
      clients[clientIndex].therapist_id = therapistId;
      clients[clientIndex].therapy_type = therapistDepartment;
    }

    updateStats();
    if (currentView === 'day') updateDayView();
    if (currentView === 'week') updateWeekView();
    if (currentView === 'list') updateListView();
    if (currentView === 'therapist') updateTherapistView();

    hideModal(appointmentModal);
    Utils.showNotification('Appointment scheduled successfully and client updated', 'success');
  } catch (error) {
    console.error('Error saving appointment:', error);
    Utils.showNotification(error?.message || 'Failed to schedule appointment', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

  async function checkAppointmentConflict(appointmentData) {
    try {
      const { data, error } = await window.supabaseClient
        .from('schedules')
        .select('id, timeslot, status')
        .eq('therapist_id', appointmentData.therapist_id)
        .eq('date', appointmentData.date)
        .eq('status', 'scheduled');

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const startHHMM = fromHHMMSS(appointmentData.timeslot);
      const [h, m] = startHHMM.split(':').map(Number);
      const newStart = h * 60 + m;
      const newEnd = newStart + DEFAULT_DURATION_MIN;

      for (const ex of data) {
        const exHHMM = fromHHMMSS(ex.timeslot);
        const [eh, em] = exHHMM.split(':').map(Number);
        const exStart = eh * 60 + em;
        const exEnd = exStart + DEFAULT_DURATION_MIN;

        if (newStart < exEnd && newEnd > exStart) {
          return { existing: ex, overlap: Math.min(newEnd, exEnd) - Math.max(newStart, exStart) };
        }
      }

      return null;
    } catch (e) {
      console.error('Error checking conflict:', e);
      return null;
    }
  }

  function showConflictWarning(conflict) {
    const conflictCheck = document.getElementById('conflictCheck');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    conflictCheck.innerHTML = `
      <div class="conflict-message error">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <strong>Schedule Conflict!</strong><br>
          Therapist already has an appointment at this time.<br>
          <small>Overlap: ${conflict.overlap} minutes</small>
        </div>
      </div>
    `;
    conflictCheck.classList.add('show', 'error');
  }

  function editAppointment(appointmentId) {
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) return;

    currentAppointmentId = appointmentId;

    document.getElementById('editStatus').value = apt.status || 'scheduled';
    document.getElementById('editDate').value = apt.date;

    const slotVal = toHHMMSS(fromHHMMSS(apt.timeslot));
    document.getElementById('editTime').value = slotVal;

    document.getElementById('editTherapist').value = apt.therapist_id;

    if (document.getElementById('editNotes')) {
      document.getElementById('editNotes').value = apt.notes || '';
    }

    const conflictCheck = document.getElementById('editConflictCheck');
    conflictCheck.classList.remove('show', 'warning', 'error', 'success');
    conflictCheck.innerHTML = '';

    showModal(editAppointmentModal);
  }

async function handleUpdateAppointment(e) {
  e.preventDefault();
  if (!currentAppointmentId) return;

  const dateStr = document.getElementById('editDate').value;
  const therapistId = document.getElementById('editTherapist').value;

  // Get therapist
  const therapist = therapists.find(t => t.id === therapistId);
  if (!therapist) {
    Utils.showNotification('Therapist not found', 'error');
    return;
  }

  // Check if therapist is on leave on selected date (only if date or therapist changed)
  const currentApt = appointments.find(a => a.id === currentAppointmentId);
  
  if ((currentApt.date !== dateStr || currentApt.therapist_id !== therapistId) && 
      therapist.leave_dates && therapist.leave_dates.length > 0) {
    
    const appointmentDate = new Date(dateStr);
    const isOnLeave = therapist.leave_dates.some((leave) => {
      const from = new Date(leave.from);
      const to = new Date(leave.to);
      return appointmentDate >= from && appointmentDate <= to;
    });

    if (isOnLeave) {
      Utils.showNotification(`Therapist ${therapist.name} is on leave on ${dateStr}. Please select another date or therapist.`, 'error');
      return;
    }
  }

  // Get therapist's department
  const therapistDepartment = therapist.department || 'General';

  const appointmentData = {
    status: document.getElementById('editStatus').value,
    date: dateStr,
    day: getDayNameFromDate(dateStr),
    timeslot: toHHMMSS(document.getElementById('editTime').value),
    therapist_id: therapistId,
    notes: (document.getElementById('editNotes')?.value || '').trim() || null
  };

  if (!appointmentData.status || !appointmentData.date || !appointmentData.timeslot || !appointmentData.therapist_id) {
    Utils.showNotification('Please fill in all required fields', 'error');
    return;
  }

  if (appointmentData.status !== 'cancelled') {
    const conflict = await checkAppointmentConflict(appointmentData);
    if (conflict && conflict.existing.id !== currentAppointmentId) {
      const conflictCheck = document.getElementById('editConflictCheck');
      conflictCheck.innerHTML = `
        <div class="conflict-message error">
          <i class="fas fa-exclamation-triangle"></i>
          <div><strong>Schedule Conflict!</strong><br>Pick another time.</div>
        </div>
      `;
      conflictCheck.classList.add('show', 'error');
      return;
    }
  }

  Utils.showLoading(true, 'Updating appointment...');
  try {
    const clientId = currentApt?.client_id;
    
    // Update client's therapist and therapy_type if changed
    if (clientId && currentApt.therapist_id !== therapistId) {
      const { error: clientUpdateError } = await window.supabaseClient
        .from('clients')
        .update({ 
          therapist_id: therapistId,
          therapy_type: therapistDepartment,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (clientUpdateError) throw clientUpdateError;
      
      // Update local client state
      const clientIndex = clients.findIndex(c => c.id === clientId);
      if (clientIndex !== -1) {
        clients[clientIndex].therapist_id = therapistId;
        clients[clientIndex].therapy_type = therapistDepartment;
      }
    }

    // Update the appointment
    const { data, error: appointmentError } = await window.supabaseClient
      .from('schedules')
      .update(appointmentData)
      .eq('id', currentAppointmentId)
      .select(`
        id, client_id, therapist_id, day, timeslot, date, status, notes, created_at,
        clients!inner (id, name, therapy_type, expires_at),
        therapists!inner (id, name, department)
      `)
      .single();

    if (appointmentError) throw appointmentError;

    const idx = appointments.findIndex((a) => a.id === currentAppointmentId);
    if (idx !== -1) appointments[idx] = data;

    updateStats();
    if (currentView === 'day') updateDayView();
    if (currentView === 'week') updateWeekView();
    if (currentView === 'list') updateListView();
    if (currentView === 'therapist') updateTherapistView();

    hideModal(editAppointmentModal);
    Utils.showNotification('Appointment updated successfully', 'success');
  } catch (error) {
    console.error('Update error:', error);
    Utils.showNotification(error?.message || 'Failed to update appointment', 'error');
  } finally {
    Utils.showLoading(false);
    currentAppointmentId = null;
  }
}
async function deleteAppointmentFromList(appointmentId) {
  const apt = appointments.find((a) => a.id === appointmentId);
  if (!apt) return;

  const confirmed = await Utils.confirmDialog(
    `Delete appointment for ${apt.clients?.name || 'Unknown'}?`,
    'Delete',
    'Cancel'
  );
  if (!confirmed) return;

  Utils.showLoading(true, 'Deleting appointment...');
  try {
    // Optional: Clear therapist_id from client if this is their only appointment
    // You can add this logic if needed
    
    const { error } = await window.supabaseClient.from('schedules').delete().eq('id', appointmentId);
    if (error) throw error;

    appointments = appointments.filter((a) => a.id !== appointmentId);
    filteredAppointments = filteredAppointments.filter((a) => a.id !== appointmentId);
    
    updateStats();
    updateListView();
    if (currentView === 'day') updateDayView();
    if (currentView === 'week') updateWeekView();
    if (currentView === 'therapist') updateTherapistView();
    
    Utils.showNotification('Appointment deleted successfully', 'success');
  } catch (e) {
    console.error('Delete error:', e);
    Utils.showNotification(e?.message || 'Failed to delete appointment', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

  async function handleDeleteAppointment() {
    if (!currentAppointmentId) return;
    await deleteAppointmentFromList(currentAppointmentId);
    hideModal(editAppointmentModal);
    currentAppointmentId = null;
  }

  function handleExport() {
    Utils.showLoading(true, 'Preparing export...');
    setTimeout(() => {
      const exportData = appointments.map((apt) => {
      const therapyType = apt.therapists?.department || 'General';
        return {
          Date: apt.date,
          Day: apt.day,
          Time: fromHHMMSS(apt.timeslot),
          Client: apt.clients?.name || '',
          Client_Expiry: apt.clients?.expires_at || '',
          Therapist: apt.therapists?.name || '',
          Therapy: therapyType,
          Status: apt.status || '',
          Notes: apt.notes || ''
        };
      });

      const headers = Object.keys(exportData[0] || {});
      const csv = [
        headers.join(','),
        ...exportData.map((row) => headers.map((h) => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Utils.showLoading(false);
      Utils.showNotification('Export completed successfully', 'success');
    }, 600);
  }

  async function handleLogout() {
    const confirmed = await Utils.confirmDialog('Are you sure you want to logout?', 'Logout', 'Cancel');
    if (!confirmed) return;

    Utils.showLoading(true, 'Logging out...');
    try {
      await window.supabaseFunctions.signOut();
      setTimeout(() => (window.location.href = 'index.html'), 600);
    } catch (e) {
      console.error('Logout error:', e);
      Utils.showNotification(e?.message || 'Failed to logout', 'error');
      Utils.showLoading(false);
    }
  }

  function showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function hideModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
});