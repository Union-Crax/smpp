let quicks = [];

async () => {
  quicks = await quick_load();
};
let links = [];
let vakken = [];
let goto_items = [];

if (document.querySelector(".topnav")) {
  fetch_links();
  fetch_vakken();
  scrape_goto();
}

function quick_cmd_list() {
  let cmd_list = [];
  for (let i = 0; i < quicks.length; i++) {
    cmd_list.push({ value: quicks[i].name, meta: "quick: " + quicks[i].url });
  }
  return cmd_list;
}

function add_quick(name, url) {
  let quick = { name: name.toLowerCase(), url: url };
  for (let i = 0; i < quicks.length; i++) {
    if (quicks[i].name == name) {
      quicks[i] = quick;
      quick_save();
      return;
    }
  }
  quicks.push(quick);
  quick_save();
}
function remove_quick(name) {
  for (let i = 0; i < quicks.length; i++) {
    if (quicks[i].name == name) {
      quicks.splice(i, 1);
      quick_save();
      return;
    }
  }
}

async function quick_load() {
  let conf = await browser.runtime.sendMessage({
    action: "getSettingsData",
  });
  if (!conf.quicks) {
    return [];
  }
  return conf.quicks;
}

async function quick_save() {
  await browser.runtime.sendMessage({
    action: "setSettingsCategory",
    category: "quicks",
    data: quicks,
  });
}

function add_quick_interactive() {
  let cmd_list = quick_cmd_list();
  dmenu(
    cmd_list,
    function (name, shift) {
      value_list = [];
      for (let i = 0; i < quicks.length; i++) {
        if (quicks[i].name == name) {
          value_list = [{ value: quicks[i].url }];
          break;
        }
      }
      dmenu(
        value_list,
        function (value, shift) {
          if (!value.startsWith("http")) {
            value = "https://" + value;
          }
          add_quick(name, value);
        },
        "value:"
      );
    },
    "name:"
  );
}

function remove_quick_interactive() {
  let cmd_list = quick_cmd_list();
  dmenu(
    cmd_list,
    function (name, shift) {
      remove_quick(name);
    },
    "name:"
  );
}

//TODO: make this better
async function config_menu() {
  const conf = await browser.runtime.sendMessage({
    action: "getSettingsData",
  });
  let cmd_list = Object.keys(conf);
  dmenu(
    cmd_list,
    function (cmd, shift) {
      conf[cmd] = dmenu(
        [],
        async function (val, shift) {
          conf[cmd] = val;
          await browser.runtime.sendMessage({
            action: "setSettingsData",
            data: conf,
          });
        },
        "value:"
      );
    },
    "config: "
  );
}

async function fetch_links() {
  links = [];
  let response = await fetch("/links/api/v1/");
  const contentType = response.headers.get("content-type");
  if (response.ok && contentType && contentType.includes("application/json")) {
    let response_data = await response.json();
    for (let i = 0; i < response_data.length; i++) {
      links.push({
        url: response_data[i].url,
        value: response_data[i].name.toLowerCase(),
        meta: "link",
      });
    }
  } else {
    console.error("Fetching links failed (" + response.status + " http code)");
    links = [];
  }
}

async function fetch_vakken() {
  vakken = [];
  let response = await fetch("/Topnav/getCourseConfig");
  const contentType = response.headers.get("content-type");
  if (response.ok && contentType && contentType.includes("application/json")) {
    let response_data = await response.json();
    for (let i = 0; i < response_data.own.length; i++) {
      let vak = response_data.own[i];
      let meta = "vak";
      if (vak.descr != "") {
        meta += "  [ " + vak.descr + " ]";
      }
      vakken.push({ url: vak.url, value: vak.name.toLowerCase(), meta: meta });
    }
  } else {
    console.error("Fetching vakken failed (" + response.status + " http code)");
    vakken = [];
  }
}

function scrape_goto() {
  goto_items = [];
  let goto_items_html = document.querySelectorAll(
    ".js-shortcuts-container > a"
  );
  for (let i = 0; i < goto_items_html.length; i++) {
    const item = goto_items_html[i];
    goto_items.push({
      url: item.href,
      value: item.innerText.toLowerCase().trim(),
      meta: "goto",
    });
  }
}

function do_qm(opener = "") {
  let cmd_list = quick_cmd_list()
    .concat(goto_items)
    .concat(vakken)
    .concat(
      links.concat([
        "home",
        "dmenu config",
        "quick add",
        "quick remove",
        "config",
        "unbloat",
        "clearsettings",
        "discord",
        "toggle performance mode",
        "gcbeta",
        "dizzy",
      ])
    );

  let role = document.doBlackMagic ? document.doBlackMagic() : "User"; //Gebruik black magic om de global chat role te krijgen.
  switch (role) {
    case "Admin":
      cmd_list.push("gc proffilter"); // Fall trough and also add gcadmin
    case "Mod":
      cmd_list.push("gcadmin");
  }

  dmenu(
    cmd_list,
    function (cmd) {
      switch (cmd) {
        case "unbloat":
          unbloat();
          return;
        case "set background":
          dmenu(
            [],
            function (url) {
              set_background(url);
              store_background(url);
            },
            "bg url:"
          );
          return;
        case "config":
          config_menu();
          return;
        case "dmenu config":
          dconfig_menu();
          return;
        case "quick add":
          add_quick_interactive();
          return;
        case "quick remove":
          remove_quick_interactive();
          return;
        case "discord":
          openURL("https://discord.com/invite/qCHZYepDqZ");
          return;
        case "home":
          openURL("/");
          return;
        case "clearsettings":
          clearsettings();
          return;
        case "toggle performance mode":
          togglePerformanceMode();
          return;
        case "gcbeta":
          openGlobalChat(null, true);
          return;
        case "dizzy":
          const styleEl = document.createElement("style");
          styleEl.innerText = `
*{
  transition: transform 10s !important;
}
*:hover{
  transform: rotate(360deg) !important;
}`;
          document.body.appendChild(styleEl);
          return;
        default:
          break;
      }
      for (let i = 0; i < quicks.length; i++) {
        const quick = quicks[i];
        if (quick.name == cmd) {
          openURL(quick.url, true);
          return;
        }
      }
      for (let i = 0; i < links.length; i++) {
        if (links[i].value == cmd) {
          openURL(links[i].url, true);
        }
      }
      for (let i = 0; i < goto_items.length; i++) {
        if (goto_items[i].value == cmd) {
          openURL(goto_items[i].url);
        }
      }
      for (let i = 0; i < vakken.length; i++) {
        if (vakken[i].value == cmd) {
          openURL(vakken[i].url);
        }
      }
    },
    "quick:",
    (opener = opener)
  );
}

document.addEventListener("keyup", function (e) {
  if (e.target != undefined && e.target.tagName === "INPUT") {
    return;
  }
  if (e.key == ":") {
    do_qm(":");
  }
});
