const today = new Date();

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
  resultsSummary: document.getElementById("results-summary")
};

const state = {
  search: "",
  track: "all",
  region: "all",
  role: "all",
  source: "all",
  activeOnly: true,
  priorityOnly: false,
  remoteFriendly: false
};

const parseDate = (value) => new Date(`${value}T00:00:00`);

const isActive = (job) => {
  if (job.status !== "active") {
    return false;
  }

  if (!job.closingDate) {
    return true;
  }

  return parseDate(job.closingDate) >= today;
};

const daysUntilClose = (job) => {
  if (!job.closingDate) {
    return null;
  }

  const distance = parseDate(job.closingDate).getTime() - today.getTime();
  return Math.ceil(distance / (1000 * 60 * 60 * 24));
};

const isPriority = (job) => isActive(job) && job.priorityScore >= 88;

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

const matchesFilters = (job) => {
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

  if (state.activeOnly && !isActive(job)) {
    return false;
  }

  if (state.priorityOnly && !isPriority(job)) {
    return false;
  }

  if (state.remoteFriendly && !["remote", "hybrid"].includes(job.workMode)) {
    return false;
  }

  return true;
};

const filteredJobs = () =>
  window.JOB_DATA.filter(matchesFilters).sort((a, b) => b.priorityScore - a.priorityScore);

const priorityJobs = () =>
  window.JOB_DATA.filter((job) => matchesFilters(job) && isPriority(job)).slice(0, 6);

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

const renderTags = (job) => {
  const items = [
    `<span class="tag ${isActive(job) ? "active" : "inactive"}">${
      isActive(job) ? "Active" : "Closed"
    }</span>`,
    `<span class="tag neutral">${trackLabel[job.track]}</span>`,
    `<span class="tag neutral">${roleLabel[job.roleFamily]}</span>`,
    `<span class="tag neutral">${sourceLabel[job.source]}</span>`
  ];

  if (isPriority(job)) {
    items.push(`<span class="tag priority">Priority ${job.priorityScore}</span>`);
  }

  return items.join("");
};

const renderPriorityCard = (job) => `
  <article class="priority-card">
    <div class="card-topline">
      <div>
        <h3 class="job-title">${job.title}</h3>
        <p class="org-name">${job.organization}</p>
      </div>
      <span class="tag priority">Score ${job.priorityScore}</span>
    </div>
    <div class="tag-row">${renderTags(job)}</div>
    <p>${job.summary}</p>
    <div class="meta-row">
      <span>${job.location}</span>
      <span>${
        daysUntilClose(job) === null ? "No closing date listed" : `Closes in ${daysUntilClose(job)} day(s)`
      }</span>
      <span>${job.workMode}</span>
    </div>
    <div class="meta-row">
      <span>Last verified: ${job.verifiedDate}</span>
      <span>${job.postedLabel || "Posted date unavailable"}</span>
    </div>
    <p class="meta-row">${job.sourceNote}</p>
    <div class="job-actions">
      <a class="button primary" href="${job.url}" target="_blank" rel="noreferrer">Open role</a>
    </div>
  </article>
`;

const renderJobCard = (job) => `
  <article class="job-card ${isActive(job) ? "" : "inactive"}">
    <div class="card-topline">
      <div>
        <h3 class="job-title">${job.title}</h3>
        <p class="org-name">${job.organization}</p>
      </div>
      <span class="mono">${job.postedDate ? `Posted ${job.postedDate}` : job.postedLabel}</span>
    </div>
    <div class="tag-row">${renderTags(job)}</div>
    <p>${job.summary}</p>
    <div class="meta-row">
      <span>${job.location}</span>
      <span>Mode: ${job.workMode}</span>
      <span>${job.closingDate ? `Close date: ${job.closingDate}` : "Close date: not listed"}</span>
    </div>
    <div class="meta-row">
      <span>Last verified: ${job.verifiedDate}</span>
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
  const jobs = filteredJobs();
  const priorities = priorityJobs();
  const activeJobs = window.JOB_DATA.filter(isActive);

  elements.activeCount.textContent = String(activeJobs.length);
  elements.priorityCount.textContent = String(priorities.length);
  elements.resultsSummary.textContent = `${jobs.length} matching role(s)`;

  elements.priorityList.innerHTML = priorities.length
    ? priorities.map(renderPriorityCard).join("")
    : renderEmptyState("No priority roles match the current filters.");

  elements.jobList.innerHTML = jobs.length
    ? jobs.map(renderJobCard).join("")
    : renderEmptyState("No jobs match these filters yet. Try widening the region, source, or role family.");
};

const bind = (element, key, parser = (value) => value) => {
  element.addEventListener("input", (event) => {
    state[key] = parser(event.target.type === "checkbox" ? event.target.checked : event.target.value);
    render();
  });

  element.addEventListener("change", (event) => {
    state[key] = parser(event.target.type === "checkbox" ? event.target.checked : event.target.value);
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
  state.search = "";
  state.track = "all";
  state.region = "all";
  state.role = "all";
  state.source = "all";
  state.activeOnly = true;
  state.priorityOnly = false;
  state.remoteFriendly = false;

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
