const DAILY_REFRESH_WINDOW_DAYS = 1;

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffInDays = (laterDate, earlierDate) =>
  Math.round((laterDate.getTime() - earlierDate.getTime()) / (1000 * 60 * 60 * 24));

const elements = {
  search: document.getElementById("search-input"),
  track: document.getElementById("track-filter"),
  region: document.getElementById("region-filter"),
  role: document.getElementById("role-filter"),
  source: document.getElementById("source-filter"),
  activeOnly: document.getElementById("active-only"),
  priorityOnly: document.getElementById("priority-only"),
  remoteFriendly: document.getElementById("remote-friendly"),
  reset: document.getElementById("reset-filters"),
  priorityList: document.getElementById("priority-list"),
  jobList: document.getElementById("job-list"),
  activeCount: document.getElementById("active-count"),
  priorityCount: document.getElementById("priority-count"),
  resultsSummary: document.getElementById("results-summary"),
  freshnessNote: document.getElementById("freshness-note")
};

const defaultState = {
  search: "",
  track: "all",
  region: "all",
  role: "all",
  source: "all",
  activeOnly: true,
  priorityOnly: false,
  remoteFriendly: false
};

const state = { ...defaultState };

const getVerificationAge = (job, today = getToday()) => {
  const verifiedDate = parseDate(job.verifiedDate);

  if (!verifiedDate) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, diffInDays(today, verifiedDate));
};

const needsDailyRefresh = (job, today = getToday()) =>
  getVerificationAge(job, today) >= DAILY_REFRESH_WINDOW_DAYS;

const getJobStatusLabel = (job, today = getToday()) => {
  if (job.status !== "active") {
    return { label: "Closed", className: "inactive" };
  }

  const closingDate = parseDate(job.closingDate);

  if (closingDate && closingDate < today) {
    return { label: "Closed", className: "inactive" };
  }

  if (needsDailyRefresh(job, today)) {
    return { label: "Needs refresh", className: "inactive" };
  }

  return { label: "Active today", className: "active" };
};

const isActive = (job, today = getToday()) => {
  if (job.status !== "active") {
    return false;
  }

  if (needsDailyRefresh(job, today)) {
    return false;
  }

  const closingDate = parseDate(job.closingDate);
  return !closingDate || closingDate >= today;
};

const daysUntilClose = (job, today = getToday()) => {
  const closingDate = parseDate(job.closingDate);

  if (!closingDate) {
    return null;
  }

  return diffInDays(closingDate, today);
};

const isPriority = (job, today = getToday()) => isActive(job, today) && job.priorityScore >= 88;

const matchesSearch = (job, term) => {
  if (!term) {
    return true;
  }

  const haystack = [
    job.title,
    job.organization,
    job.location,
    job.summary,
    job.roleFamily,
    job.track,
    ...(job.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
};

const matchesFilters = (job, today = getToday()) => {
  if (!matchesSearch(job, state.search)) {
    return false;
  }

  if (state.track !== "all" && job.track !== state.track) {
    return false;
  }

  if (state.region !== "all" && job.region !== state.region) {
    return false;
  }

  if (state.role !== "all" && job.roleFamily !== state.role) {
    return false;
  }

  if (state.source !== "all" && job.source !== state.source) {
    return false;
  }

  if (state.activeOnly && !isActive(job, today)) {
    return false;
  }

  if (state.priorityOnly && !isPriority(job, today)) {
    return false;
  }

  if (state.remoteFriendly && !["remote", "hybrid"].includes(job.workMode)) {
    return false;
  }

  return true;
};

const filteredJobs = (today) =>
  window.JOB_DATA
    .filter((job) => matchesFilters(job, today))
    .sort((a, b) => b.priorityScore - a.priorityScore);

const priorityJobs = (today, jobs = filteredJobs(today)) =>
  jobs.filter((job) => isPriority(job, today)).slice(0, 6);

const sourceLabel = {
  linkedin: "LinkedIn",
  seek: "Seek",
  indeed: "Indeed",
  company: "Company Site"
};

const trackLabel = {
  research: "Research",
  industry: "Industry"
};

const roleLabel = {
  cybersecurity: "Cyber Security",
  "ai-research": "AI Research",
  "software-engineering": "Software Engineering",
  "data-analytics": "Data Analytics"
};

const formatRefreshLabel = (job, today) => {
  const verificationAge = getVerificationAge(job, today);

  if (!Number.isFinite(verificationAge)) {
    return "Needs verification";
  }

  if (verificationAge === 0) {
    return "Checked today";
  }

  return `Refresh overdue by ${verificationAge} day(s)`;
};

const renderTags = (job, today) => {
  const statusTag = getJobStatusLabel(job, today);
  const items = [
    `<span class="tag ${statusTag.className}">${statusTag.label}</span>`,
    `<span class="tag neutral">${trackLabel[job.track]}</span>`,
    `<span class="tag neutral">${roleLabel[job.roleFamily]}</span>`,
    `<span class="tag neutral">${sourceLabel[job.source]}</span>`
  ];

  if (isPriority(job, today)) {
    items.push(`<span class="tag priority">Priority ${job.priorityScore}</span>`);
  }

  return items.join("");
};

const renderPriorityCard = (job, today) => {
  const closeInDays = daysUntilClose(job, today);

  return `
  <article class="priority-card">
    <div class="card-topline">
      <div>
        <h3 class="job-title">${job.title}</h3>
        <p class="org-name">${job.organization}</p>
      </div>
      <span class="tag priority">Score ${job.priorityScore}</span>
    </div>
    <div class="tag-row">${renderTags(job, today)}</div>
    <p>${job.summary}</p>
    <div class="meta-row">
      <span>${job.location}</span>
      <span>${closeInDays === null ? "No closing date listed" : `Closes in ${closeInDays} day(s)`}</span>
      <span>${job.workMode}</span>
    </div>
    <div class="meta-row">
      <span>Last verified: ${job.verifiedDate}</span>
      <span>${formatRefreshLabel(job, today)}</span>
      <span>${job.postedLabel || "Posted date unavailable"}</span>
    </div>
    <p class="meta-row">${job.sourceNote}</p>
    <div class="job-actions">
      <a class="button primary" href="${job.url}" target="_blank" rel="noreferrer">Open role</a>
    </div>
  </article>
`;
};

const renderJobCard = (job, today) => `
  <article class="job-card ${isActive(job, today) ? "" : "inactive"}">
    <div class="card-topline">
      <div>
        <h3 class="job-title">${job.title}</h3>
        <p class="org-name">${job.organization}</p>
      </div>
      <span class="mono">${job.postedDate ? `Posted ${job.postedDate}` : job.postedLabel}</span>
    </div>
    <div class="tag-row">${renderTags(job, today)}</div>
    <p>${job.summary}</p>
    <div class="meta-row">
      <span>${job.location}</span>
      <span>Mode: ${job.workMode}</span>
      <span>${job.closingDate ? `Close date: ${job.closingDate}` : "Close date: not listed"}</span>
    </div>
    <div class="meta-row">
      <span>Last verified: ${job.verifiedDate}</span>
      <span>${formatRefreshLabel(job, today)}</span>
      <span>${job.sourceNote}</span>
    </div>
    <div class="meta-row">
      ${(job.tags || []).map((tag) => `<span class="tag neutral">${tag}</span>`).join("")}
    </div>
    <div class="job-actions">
      <a class="button primary" href="${job.url}" target="_blank" rel="noreferrer">View posting</a>
      <a class="button secondary" href="${job.url}" target="_blank" rel="noreferrer">Mark for apply</a>
    </div>
  </article>
`;

const renderEmptyState = (message) => `<div class="empty-state">${message}</div>`;

const render = () => {
  const today = getToday();
  const jobs = filteredJobs(today);
  const priorities = priorityJobs(today, jobs);
  const activeJobs = window.JOB_DATA.filter((job) => isActive(job, today));

  elements.activeCount.textContent = String(activeJobs.length);
  elements.priorityCount.textContent = String(priorities.length);
  elements.resultsSummary.textContent = `${jobs.length} matching role(s)`;
  elements.freshnessNote.textContent = `Daily verification window: ${DAILY_REFRESH_WINDOW_DAYS} ${
    DAILY_REFRESH_WINDOW_DAYS === 1 ? "day" : "days"
  }`;

  elements.priorityList.innerHTML = priorities.length
    ? priorities.map((job) => renderPriorityCard(job, today)).join("")
    : renderEmptyState("No priority roles match the current filters.");

  elements.jobList.innerHTML = jobs.length
    ? jobs.map((job) => renderJobCard(job, today)).join("")
    : renderEmptyState(
        "No jobs match these filters yet. Try widening the region, source, or role family."
      );
};

const readFieldValue = (event) =>
  event.target.type === "checkbox" ? event.target.checked : event.target.value;

const bind = (element, key, parser = (value) => value) => {
  const eventName = element.tagName === "INPUT" && element.type !== "checkbox" ? "input" : "change";

  element.addEventListener(eventName, (event) => {
    state[key] = parser(readFieldValue(event));
    render();
  });
};

bind(elements.search, "search", (value) => value.trim().toLowerCase());
bind(elements.track, "track");
bind(elements.region, "region");
bind(elements.role, "role");
bind(elements.source, "source");
bind(elements.activeOnly, "activeOnly", Boolean);
bind(elements.priorityOnly, "priorityOnly", Boolean);
bind(elements.remoteFriendly, "remoteFriendly", Boolean);

elements.reset.addEventListener("click", () => {
  Object.assign(state, defaultState);

  elements.search.value = "";
  elements.track.value = "all";
  elements.region.value = "all";
  elements.role.value = "all";
  elements.source.value = "all";
  elements.activeOnly.checked = true;
  elements.priorityOnly.checked = false;
  elements.remoteFriendly.checked = false;

  render();
});

render();
