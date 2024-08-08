var activities = [];

var bkp_activities = [];
var index_chart = 0;

let holidays = [];

async function loadActivities() {
  await fetch("https://api.jsonbin.io/v3/b/66afccc9ad19ca34f891678b", {
    method: "GET",
    headers: {
      "X-Master-Key":
        "$2a$10$s/nd28gEBk/DDb.CzQPITuFAPVbPR8igpDPQzVPFunGITEWOAdxj.",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      bkp_activities.push(JSON.parse(JSON.stringify(data.record)));
      activities = data.record;
    })
    .catch((error) => console.error("Error:", error));
}

async function updateActivities() {
  await fetch("https://api.jsonbin.io/v3/b/66afccc9ad19ca34f891678b", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key":
        "$2a$10$s/nd28gEBk/DDb.CzQPITuFAPVbPR8igpDPQzVPFunGITEWOAdxj.",
    },
    body: JSON.stringify(activities),
  })
    .then((response) => response.json())
    .then((data) => {
      bkp_activities.push(JSON.parse(JSON.stringify(data.record)));
      activities = data.record;
      index_chart++;
    })
    .catch((error) => console.error("Error:", error));
}

function loadHolidays() {
  fetch("./activities/holidays.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      holidays = data;
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });
}

function calculateDaysBetweenDates(startDate, endDate) {
  // Convert the dates to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the difference in milliseconds
  const differenceInMilliseconds = end - start;

  // Convert the difference from milliseconds to days
  const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);

  return differenceInDays;
}

function getHoliday(date) {
  const formattedDate = date.toISOString().split("T")[0];
  return holidays.filter((holiday) => holiday.date === formattedDate);
}

function getNextDateSkippingWeekends(
  initialDate,
  days,
  workOnSaturday = false,
  workOnSunday = false,
  workOnHoliday = false
) {
  let date = new Date(initialDate);

  while (days > 0) {
    date.setDate(date.getDate() + 1);

    const dayOfWeek = date.getDay();

    if (
      (dayOfWeek !== 0 || workOnSunday) &&
      (dayOfWeek !== 6 || workOnSaturday) &&
      (workOnHoliday || getHoliday(date).length === 0) // Pula se for feriado
    ) {
      days--;
    }
  }

  return date.toISOString().split("T")[0];
}

function sortActivities() {
  const result = [];

  function addActivity({ depends, ...item }) {
    result.push(item);
    depends.forEach((a) => addActivity(a));
  }

  activities
    .map((a) => {
      a.depends = activities.filter((dep) => dep.dependent_id == a.id);
      return a;
    })
    .filter((a) => a.dependent_id == 1000 || a.dependent_id == null)
    .forEach((a) => {
      addActivity(a);
    });

  return result.map(({ depends, ...item }) => {
    return item;
  });
}

function calculateActivityDates() {
  activities = sortActivities();

  return activities.map((a) => {
    const dependent = activities.filter((d) => d.id == a.dependent_id)[0];
    if ((a.start_date == null || a.start_date == "") && dependent.end_date) {
      a.start_date = getNextDateSkippingWeekends(
        activities.filter((d) => d.id == a.dependent_id)[0].end_date,
        1,
        a.workOnSaturday,
        a.workOnSunday,
        a.workOnHoliday
      );
    }

    if (a.start_date) {
      a.end_date = getNextDateSkippingWeekends(
        a.start_date,
        a.duration + a.late - 1,
        a.workOnSaturday,
        a.workOnSunday,
        a.workOnHoliday
      );
    }

    return a;
  });
}

function hasChildren(id) {
  return activities.some((a) => a.dependent_id == id);
}

function resetDependencyActivities(id) {
  activities = activities.map((a) => {
    if (a.dependent_id == id) {
      a.start_date = null;
      a.end_date = null;
      resetDependencyActivities(a.id);
    }
    return a;
  });
}

function getActivity(id) {
  return activities.find((a) => a.id == id);
}

function createActivity(item) {
  console.log("createActivity", item);

  const start_date = new Date(
    item.start_date.setDate(item.start_date.getDate() + 1)
  );

  if (!start_date || start_date.getFullYear() == 1970) {
    alert("Houve um erro ao atualizar o item");
    console.log(item);
    return false;
  }

  const activity = {
    id: item.id,
    name: item.text,
    duration: item.duration,
    late: 0,
    dependent_id: item.parent == 0 ? null : item.parent,
    start_date: start_date.toISOString().split("T")[0],
    end_date: null,
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
  };

  activities.push(activity);
  console.log(activities);
  return true;
}

function updateActivity(item, activity) {
  console.log("updateActivity", item);

  const start_date = new Date(
    item.start_date.setDate(item.start_date.getDate() + 1)
  );

  if (!start_date || start_date.getFullYear() == 1970) {
    alert("Houve um erro ao atualizar o item");
    console.log(item);
    return false;
  }

  activity.name = item.text;
  activity.duration = item.duration;
  activity.dependent_id = item.parent;
  activity.progress = item.progress;
  activity.start_date = start_date.toISOString().split("T")[0];
  activity.end_date = null;

  return true;
}

function removeActivity(id) {
  activities = activities
    .filter((a) => a.id != id)
    .map((a) => {
      if (a.dependent_id == id) {
        a.dependent_id = null;
      }
      return a;
    });
}

function validateChangeDate({ parent, start_date }) {
  return true;
  const parentElement = getActivity(parent);
  const result = !parentElement || new Date(start_date.setDate(start_date.getDate() + 1)).toISOString().split("T")[0] >= parentElement.end_date;
  
  if (parentElement) {
    start_date.setDate(start_date.getDate() + -1);
  }
  return result;
}
