Date.prototype.toFormattedDateString = function () {
  return this.toISOString().split("T")[0];
};

Date.prototype.toFormattedDate = function() {
  const dia = String(this.getDate()).padStart(2, '0'); // Pega o dia e garante que tenha 2 dígitos
  const mes = String(this.getMonth() + 1).padStart(2, '0'); // Pega o mês (0-11), por isso o +1, e garante 2 dígitos
  const ano = this.getFullYear(); // Pega o ano com 4 dígitos

  return `${dia}/${mes}/${ano}`;
};
const fake = [
  {
    id: 1,
    name: "Passo 1",
    start_date: "2024-08-21",
    end_date: "2024-08-21",
    late: 0,
    dependent_id: "1000",
    workOnSaturday: false,
    workOnSunday: false,
    workOnHoliday: false,
    duration: 1,
    progress: "1",
    critical_path: 1,
  },
  {
    id: 1723059957741,
    name: "Passo 2",
    duration: 2,
    late: 0,
    dependent_id: "1",
    start_date: "2024-08-23",
    end_date: "2024-08-26",
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    progress: 0,
    critical_path: 1,
  },
  {
    id: 1723059957742,
    name: "1.2.1.1",
    duration: 1,
    late: 0,
    dependent_id: "0",
    start_date: "2024-08-27",
    end_date: null,
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    progress: "",
    critical_path: 1,
  },
  {
    id: 1723059957743,
    name: "1.2.1.1.1",
    duration: 1,
    late: 0,
    dependent_id: "1723059957742",
    start_date: "2024-08-28",
    end_date: "2024-08-28",
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    progress: "",
    critical_path: 1,
  },
  {
    id: 1723059957744,
    name: "1.2.1.1.1.1",
    duration: 1,
    late: 0,
    dependent_id: "1723059957743",
    start_date: "2024-08-29",
    end_date: "2024-08-29",
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    progress: "",
    critical_path: 1,
  },
  {
    id: 1723059957745,
    name: "1.2.1.1.1.1.1",
    duration: 1,
    late: 0,
    dependent_id: "1723059957744",
    start_date: "2024-08-30",
    end_date: "2024-08-30",
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    critical_path: 1,
    progress: "",
  },
  {
    id: 1723059957739,
    name: "Passo X",
    duration: 1,
    late: 0,
    dependent_id: "1000",
    start_date: "2024-08-22",
    end_date: "2024-08-22",
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    progress: "",
    critical_path: 0,
  },
  {
    id: 1723059957740,
    name: "Passo 4",
    duration: 1,
    late: 0,
    dependent_id: "1723206476001",
    start_date: "2024-09-02",
    end_date: "2024-09-02",
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    critical_path: 1,
    progress: 0,
  },
  {
    id: 1723132806045,
    name: "Passo Z",
    duration: 4,
    late: 0,
    dependent_id: "1000",
    start_date: "2024-08-27",
    end_date: "2024-08-30",
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    progress: "",
    critical_path: 0,
  },
  {
    id: 1723206476001,
    name: "Passo 3",
    duration: 1,
    late: 0,
    dependent_id: "1723059957741",
    start_date: "2024-08-30",
    critical_path: 1,
    end_date: "2024-08-30",
    workOnHoliday: false,
    workOnSaturday: false,
    workOnSunday: false,
    progress: 0.7,
  },
];

const bkpService = {
  activities: [],
  index: 0,
  next: function () {
    this.index++;
  },
  previous: function () {
    this.index--;
  },
  add: function (item) {
    this.activities.push(JSON.parse(JSON.stringify(item)));
  },
  get: function () {
    return this.activities[this.index];
  },
};

const repository = {
  activities: [],
  apiPath: "https://api.jsonbin.io/v3/b/66afccc9ad19ca34f891678b",
  apiKey: "$2a$10$s/nd28gEBk/DDb.CzQPITuFAPVbPR8igpDPQzVPFunGITEWOAdxj.",

  add: function (item) {
    console.log("createActivity", item);

    const start_date = new Date(
      item.start_date.setDate(item.start_date.getDate() + 1)
    );

    if (!start_date || start_date.getFullYear() == 1970) {
      return false;
    }

    this.activities.push({
      id: item.id,
      name: item.text,
      duration: item.duration,
      late: 0,
      dependent_id: item.parent == 0 ? null : item.parent,
      start_date: start_date.toFormattedDateString(),
      critical_path: 0,
      end_date: null,
      workOnHoliday: false,
      workOnSaturday: false,
      workOnSunday: false,
    });
    return true;
  },
  update: function (item) {
    console.log("updateActivity", item);

    const start_date = new Date(
      item.start_date.setDate(item.start_date.getDate() + 1)
    );

    if (!start_date || start_date.getFullYear() == 1970) {
      console.log("Data inválida", item);
      return false;
    }

    const activity_index = this.activities.findIndex((a) => a.id == item.id);

    if (activity_index == -1) {
      console.log("Não não foi encontrado", item);
      return false;
    }

    this.activities[activity_index].name = item.text;
    this.activities[activity_index].duration = item.duration;
    this.activities[activity_index].dependent_id = item.parent;
    this.activities[activity_index].progress = item.progress;
    this.activities[activity_index].start_date =
      start_date.toFormattedDateString();
    this.activities[activity_index].end_date = null;

    return true;
  },
  remove: function (id) {
    console.log("item", id);
    this.activities = this.activities
      .filter((a) => a.id != id)
      .map((a) => (a.dependent_id == id ? { ...a, dependent_id: null } : a));

    console.log("remove", this.activities);
    return true;
  },
  resetChildren: function (id) {
    const children = this.getAllChildren(id).map((a) => a.id);

    this.activities = this.activities.map((a) => {
      if (children.includes(a.id)) {
        a.start_date = null;
        a.end_date = null;
      }
      return a;
    });
  },
  getOne: function (id) {
    return this.activities.find((a) => a.id == id);
  },
  getAllParents: function (id) {
    return this.activities
      .filter((a) => a.id == id)
      .reduce((acc, a) => {
        acc.push(a);
        if (a.dependent_id) {
          acc = acc.concat(this.getAllParents(a.dependent_id));
        }
        return acc;
      }, []);
  },
  getAllChildren: function (parent_id) {
    return this.activities
      .filter((a) => a.dependent_id == parent_id)
      .reduce((acc, a) => {
        acc.push(a);
        acc = acc.concat(this.getAllChildren(a.id));
        return acc;
      }, []);
  },
  loadAjax: async function () {
    parent = this;
    await fetch(parent.apiPath, {
      method: "GET",
      headers: {
        "X-Master-Key": parent.apiKey,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        bkpService.activities.push(JSON.parse(JSON.stringify(data.record)));
        parent.activities = data.record;
      })
      .catch((error) => {
        console.log("Error:", error);
        parent.activities = fake;
      });
  },
  load: function (activities) {
    this.activities = activities;
  },
  saveAllAjax: async function () {
    parent = this;
    await fetch(parent.apiPath, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": parent.apiKey,
      },
      body: JSON.stringify(parent.activities),
    })
      .then((response) => response.json())
      .then((data) => {
        parent.activities = data.record;
      })
      .catch((error) => {
        //console.error("Error:", error)
      });
  },
  hasChildren: function (id) {
    return this.activities.some((a) => a.dependent_id == id);
  },
};

const service = {
  maxDate: function () {
    return new Date(
      Math.max(...repository.activities.map((a) => new Date(a.end_date)))
    );
  },
  minDate: function () {
    return new Date(
      Math.min(...repository.activities.map((a) => new Date(a.start_date)))
    );
  },
  getNextDateSkippingWeekends: function (
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
        (dayOfWeek !== 6 || workOnSaturday)
      ) {
        days--;
      }
    }

    return date.toFormattedDateString();
  },
  getActivitiesOrderedByDependency: function () {
    return repository.activities
      .filter(
        (a) =>
          a.dependent_id == 1000 ||
          a.dependent_id == null ||
          a.dependent_id == "0"
      )
      .reduce((acc, a) => {
        acc.push(a);
        acc = acc.concat(repository.getAllChildren(a.id));
        return acc;
      }, []);
  },
  getActivitiesWithCalculatedDates: function () {
    const items = this.getActivitiesOrderedByDependency();
    console.log("items", items);
    return items.map((a) => {
      const parent = items.find((d) => d.id == a.dependent_id);

      if ((a.start_date == null || a.start_date == "") && parent.end_date) {
        a.start_date = this.getNextDateSkippingWeekends(
          parent.end_date,
          1,
          a.workOnSaturday,
          a.workOnSunday,
          a.workOnHoliday
        );
      }

      if (a.start_date) {
        a.end_date = this.getNextDateSkippingWeekends(
          a.start_date,
          a.duration + a.late - 1,
          a.workOnSaturday,
          a.workOnSunday,
          a.workOnHoliday
        );
      }
      return a;
    });
  },
  getActivitiesWithCriticalPath: function () {
    const items = this.getActivitiesWithCalculatedDates();

    const max_end_date = new Date(
      Math.max(...items.map((a) => new Date(a.end_date)))
    ).toFormattedDateString();

    const parents = items
      .filter((a) => a.end_date == max_end_date)
      .reduce((acc, a) => {
        acc.push(a.id);
        acc = acc.concat(repository.getAllParents(a.id).map((d) => d.id));
        return acc;
      }, []);

    return items.map((a) => {
      if (parents.includes(a.id)) {
        a.critical_path = 1;
      } else {
        a.critical_path = 0;
      }
      return a;
    });
  },
  getFullActivityList: function () {
    return this.getActivitiesWithCriticalPath();
  },
  calculateDaysBetweenDates: function (start, end) {
    return (end - start) / (1000 * 60 * 60 * 24);
  },
  validateRemove: function () {
    return repository.activities.length > 1;
  },
  validateChange: function (item) {
    return (
      !this.hasParentValid(item.parent) || 
      repository.getOne(item.parent).end_date <=
        item.start_date.toFormattedDateString()
    );
  },
  getParentId: function (id) {
    return id > 0 && id != 1000 ? id : 1000;
  },
  hasParentValid: function (id) {
    return id > 0 && id != 1000;
  },
};
