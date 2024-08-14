Date.prototype.toFormattedDateString = function () {
  return this.toISOString().split("T")[0];
};

Date.prototype.toFormattedDate = function (format_db = false) {
  const dia = String(this.getDate()).padStart(2, "0"); // Pega o dia e garante que tenha 2 dígitos
  const mes = String(this.getMonth() + 1).padStart(2, "0"); // Pega o mês (0-11), por isso o +1, e garante 2 dígitos
  const ano = this.getFullYear(); // Pega o ano com 4 dígitos

  return format_db ? `${ano}-${mes}-${dia}` : `${dia}/${mes}/${ano}`;
};

const fake = [];

const bkpService = {
  items: [],
  index: 0,
  next: function () {
    this.index++;
  },
  previous: function () {
    this.index--;
  },
  add: function () {
    if (this.items.length == 9) {
      this.index = 0;
      this.items = [];
    } else {
      this.next();
    }

    this.items.push({
      activities: JSON.parse(JSON.stringify(repository.activities)),
      links: JSON.parse(JSON.stringify(repositoryLink.links)),
    });
  },
  get: function () {
    return JSON.parse(JSON.stringify(this.items[this.index]));
  },
  isFirst: function () {
    return this.index == 0;
  },
  isLast: function () {
    return (
      this.items.length == 0 ||
      this.items.length-1 == this.index
    );
  },
  reset: function () {
    if (this.items.length == 10) {
      this.index = 0;
      this.items = [
        this.items[this.items.length - 1],
      ];
    }
  },
};

const config = {
  workOnSaturday: false,
  workOnSunday: false,
  workOnHoliday: false,
};

const repository = {
  activities: [],

  add: function (item) {
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
    const start_date = new Date(
      item.start_date.setDate(item.start_date.getDate() + 1)
    );

    if (!start_date || start_date.getFullYear() == 1970) {
      console.log("Invalid date", item);
      return false;
    }

    const activity_index = this.activities.findIndex((a) => a.id == item.id);

    if (activity_index == -1) {
      console.log("Not found", item);
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
    this.activities = this.activities
      .filter((a) => a.id != id)
      .map((a) => (a.dependent_id == id ? { ...a, dependent_id: null } : a));
    return true;
  },
  resetChildren: function (ids) {
    this.activities = this.activities.map((a) => {
      if (ids.includes(a.id)) {
        a.start_date = null;
        a.end_date = null;
      }
      return a;
    });
  },
  getOne: function (id) {
    return this.activities.find((a) => a.id == id);
  },
  getOneChild: function (parent_id) {
    return this.activities.find((a) => a.dependent_id == parent_id);
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
  load: function (activities) {
    this.activities = activities;
  },
  hasChildren: function (id) {
    return this.activities.some((a) => a.dependent_id == id);
  },
  getLastActivityById: function (ids) {
    return this.activities
      .filter((a) => ids.includes(a.id))
      .sort((a, b) => b.end_date - a.end_date)[0];
  },
};

const service = {
  maxDate: function () {
    return repository.activities.length
      ? new Date(
          Math.max(...repository.activities.map((a) => new Date(a.end_date)))
        )
      : null;
  },
  minDate: function () {
    return repository.activities.length
      ? new Date(
          Math.min(...repository.activities.map((a) => new Date(a.start_date)))
        )
      : null;
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
    const baseIds = repositoryLink.links.map((a) => parseInt(a.target));

    const allSteps = repository.activities.map((a) => ({
      ...a,
      org_start_date: a.start_date,
    }));

    const firstSteps = allSteps.filter(
      (a) => !baseIds.includes(parseInt(a.id))
    );
    const calculateChildren = (parent) => {
      repositoryLink
        .getAllBySource(parent.id)
        .map((d) => parseInt(d.target))
        .forEach((id) => {
          const child = allSteps.find((d) => d.id == id);
          if (
            child.start_date == null ||
            (child.org_start_date == null &&
              child.end_date &&
              child.end_date <= parent.end_date)
          ) {
            child.start_date = this.getNextDateSkippingWeekends(
              parent.end_date,
              1,
              config.workOnSaturday,
              config.workOnSunday,
              config.workOnHoliday
            );
          }
          if (child.start_date) {
            child.end_date = this.getNextDateSkippingWeekends(
              child.start_date,
              child.duration + child.late - 1,
              config.workOnSaturday,
              config.workOnSunday,
              child.workOnHoliday
            );
          }
          calculateChildren(child);
        });
    };

    const project_start_date = new Date(
      Math.min(...firstSteps.filter((a) => a.start_date).map((a) => new Date(a.start_date)))
    );
    
    firstSteps.forEach((parent) => {
      parent.start_date = parent.start_date ?? project_start_date.toFormattedDate(true);
      parent.end_date = this.getNextDateSkippingWeekends(
        parent.start_date,
        parent.duration + parent.late - 1,
        config.workOnSaturday,
        config.workOnSunday,
        parent.workOnHoliday
      );

      calculateChildren(parent);
    });

    return allSteps.map((a) => {
      if (a.end_date == null) {
        a.end_date = this.getNextDateSkippingWeekends(
          a.start_date,
          a.duration + a.late - 1,
          config.workOnSaturday,
          config.workOnSunday,
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
    );

    const lastItems = items
      .filter((a) => a.end_date == max_end_date.toFormattedDateString())
      .map((a) => parseInt(a.id));

    const parents = repositoryLink.links
      .filter((a) => lastItems.includes(parseInt(a.target)))
      .reduce((acc, a) => {
        acc = acc.concat(repositoryLink.getAllParents(a.target));
        return acc;
      }, []);

    return items.map((a) => {
      if (
        parents.includes(parseInt(a.id)) ||
        lastItems.includes(parseInt(a.id))
      ) {
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
  getParentId: function (id) {
    return id > 0 && id != 1000 ? id : 1000;
  },
  hasParentValid: function (id) {
    return id > 0 && id != 1000;
  },
  saveBkp: function () {
    bkpService.add();
  },
  validateChangeByParent: function (item) {
    return (
      !this.hasParentValid(item.parent) ||
      repository.getOne(item.parent).start_date <=
        item.start_date.toFormattedDate(true)
    );
  },
  validateChangeByChild: function (item) {
    const child = repository.getOneChild(item.id);
    return !child || child.start_date >= item.end_date.toFormattedDateString();
  },
  download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify({
        activities: repository.activities,
        links: repositoryLink.links,
        config: config
      })], {
        type: "application/json",
      })
    );
    a.download = "data.json";
    a.click();
  },
  clear: function () {
    repository.load([]);
    repositoryLink.load([]);
  },
  removeActivity: function (id) {
    repository.remove(id);
    repositoryLink.removeAllByActivity(id);
  },
};

const repositoryLink = {
  links: [],
  add: function (item) {
    this.links.push({
      id: item.id,
      source: item.source,
      target: item.target,
      type: "0",
    });
  },
  load: function (items) {
    this.links = items;
  },
  remove: function (id) {
    this.links = this.links.filter((a) => a.id != id);
  },
  removeAllByActivity: function (id) {
    this.load(this.links.filter((a) => a.source != id && a.target != id));
  },
  getAllBySource(id) {
    return this.links.filter((a) => a.source == id);
  },
  getAllByTarget(id) {
    return this.links.filter((a) => a.target == id);
  },
  getAllParents: function (id) {
    const parents = new Set();
    const findParentsByTarget = (id) => {
      this.links
        .filter((a) => a.target == id)
        .forEach((a) => {
          if (!parents.has(parseInt(a.source))) {
            parents.add(parseInt(a.source));
            findParentsByTarget(a.source);
          }
        });
    };
    findParentsByTarget(id);
    return Array.from(parents);
  },
  getAllChildren: function (id) {
    const children = new Set();

    const findChildrenBySource = (id) => {
      this.links
        .filter((a) => a.source == id)
        .forEach((a) => {
          if (!children.has(parseInt(a.target))) {
            children.add(parseInt(a.target));
            findChildrenBySource(a.target);
          }
        });
    };

    findChildrenBySource(id);
    return Array.from(children);
  },
  hasChildren(id) {
    return this.links.some((a) => a.source == id);
  },
  validateAdd: function (item) {
    return !this.getAllChildren(item.target).some(
      (x) => x == parseInt(item.source)
    );
  },
};

const syncService = {
  apiPath: "https://api.jsonbin.io/v3/b/66afccc9ad19ca34f891678b",
  apiKey: "$2a$10$s/nd28gEBk/DDb.CzQPITuFAPVbPR8igpDPQzVPFunGITEWOAdxj.",

  save: async function () {
    parent = this;
    return fetch(parent.apiPath, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": parent.apiKey,
      },
      body: JSON.stringify({
        activities: repository.activities,
        links: repositoryLink.links,
        config: config,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const { activities = [], links = [], config = {} } = data.record;

        repository.load(activities);
        repositoryLink.load(links);
        
        config.workOnSaturday = config.workOnSaturday || false;
        config.workOnSunday = config.workOnSunday || false;
        config.workOnHoliday = config.workOnHoliday || false;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  },
  load: async function () {
    parent = this;
    return fetch(parent.apiPath, {
      method: "GET",
      headers: {
        "X-Master-Key": parent.apiKey,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const { activities = [], links = [] } = data.record;

        bkpService.items.push({
          activities: activities,
          links: links,
        });

        repository.load(activities);
        repositoryLink.load(links);

        config.workOnSaturday = data.record?.config.workOnSaturday || false;
        config.workOnSunday = data.record?.workOnSunday || false;
        config.workOnHoliday = data.record?.workOnHoliday || false;
      })
      .catch((error) => {
        console.log("Error:", error);
        repository.load(fake);
      });
  },
};
