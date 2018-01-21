const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
var TinyURL = require('tinyurl')
var urljoin = require('url-join')
var prependHttp = require('prepend-http')
const request = require("request");

const num_modules = 9;

const components = [null,null,null,null,null,null,null,null,"Knob", "Slider", "Light1", "Light2"]

const op_types = {
    Slider: "out",
    Knob: "out",
    Light1: "in",
    Light2: "in"
}

// board component names and values in module order
var board_layout = new Array(num_modules).fill(null)

var m_board_layout = new Array(num_modules).fill(null)

// modules->url rules expose
var expose_rules = new Array(num_modules).fill(null)

// url->modules rules listen
var listen_rules = new Array(num_modules).fill(null)

// module->module rules wire
var wire_rules = new Array(num_modules).fill(null)

// save last config
var last = {
    Knob: {url_in: null, wire_in: null},
    Slider: {url_in: null, wire_in: null},
    Light1: {url_out: null, wire_out: null},
    Light2: {url_out: null, wire_out: null}
}


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/get-last', function(req,res) {
    res.json(last)
})

app.get('/reset-rules', function(req,res) {
    m_board_layout = new Array(num_modules).fill(null)

// modules->url rules expose
    expose_rules = new Array(num_modules).fill(null)

// url->modules rules listen
    listen_rules = new Array(num_modules).fill(null)

// module->module rules wire
    wire_rules = new Array(num_modules).fill(null)

// save last config
    last = {
        Knob: {url_in: null, wire_in: null},
        Slider: {url_in: null, wire_in: null},
        Light1: {url_out: null, wire_out: null},
        Light2: {url_out: null, wire_out: null}
    }
})

// called when a component is added or removed or modified
app.post('/m-update-board', function(req,res) {
    console.log(req.body.l)
    var new_board_layout = req.body.l
    var removed_modules = []
    var updated_modules = []
    var added_modules = []
    for (var i = 0; i < num_modules; ++i) {
        // get removed_modules
        if (board_layout[i] !== null && new_board_layout[i] === null) {
            removed_modules.push(i)
        }

        // cast strings to ints
        if (new_board_layout[i] !== null) {
            new_board_layout[i].v = parseInt(new_board_layout[i].v)
            new_board_layout[i].t = parseInt(new_board_layout[i].t)

            // will be updated later
            // set default in vals to 0, will get set later if has wired connection
            if (op_types[components[new_board_layout[i].t]] === "in") {
                new_board_layout[i].v = 0
            }
        }

        // get added modules
        if (board_layout[i] === null && new_board_layout[i] !== null) {
            added_modules.push(i)
        }

        // get updated modules that control others
        if (new_board_layout[i] !== null &&
            wire_rules[i] !== null)// &&
            //board_layout[i].v !== new_board_layout[i].v)
        {
            updated_modules.push(i)
        }
    }

    console.log("removed_modules: ")
    console.log(removed_modules)

    // get rid of unnecessary rules resulting from removal of modules

    for (var i = 0; i < removed_modules.length; ++i) {
        console.log('removing rules for ' + i)
        var r_module = removed_modules[i]
        var component = board_layout[r_module]
        console.log(i)
        console.log(component)

        if (component.op_type === "out") {
            last[component.type].url_in = expose_rules[r_module]
            expose_rules[r_module] = null
            last[component.type].wire_in = wire_rules[r_module]
            wire_rules[r_module] = null
        }


        if (component.op_type === "in") {

            last[component.type].url_out = listen_rules[r_module]
            listen_rules[r_module] = null

            for (var k = 0; k < num_modules; ++k) {
                if (wire_rules[k] === r_module) {
                    last[component.type].wire_out = k
                    wire_rules[k] = null
                    console.log('k no long outputs to a wire')
                }
            }
        }

    }

    // add rules if previous rules are stored

    console.log("added_modules: ")
    console.log(added_modules)

    for (var i = 0; i < added_modules.length; ++i) {
        var a_module = added_modules[i]

        var component = new_board_layout[a_module]
        var type = components[component.t]

        var last_rule = last[type]
        if (op_types[type] === "in") {

            //relisten
            listen_rules[a_module] = last_rule.url_out

            if (last_rule.wire_out !== null) {
                if (new_board_layout[last_rule.wire_out] !== null) {
                    //rewire
                    var free = true
                    if (wire_rules[last_rule.wire_out] !== null) {
                        free = false
                    }
                    if (free) {
                        wire_rules[last_rule.wire_out] = a_module
                        updated_module.push(last_rule.wire_out)
                    }
                }
            }
        } else {

            //reexpose
            expose_rules[a_module] = last_rule.url_in

            if (last_rule.wire_in !== null) {
                if (new_board_layout[last_rule.wire_in] !== null) {
                    //rewire
                    var free = true
                    for (var i = 0; i < num_modules; ++i) {
                        if (wire_rules[i] === last_rule.wire_in) {
                            free = false
                            break
                        }
                    }
                    if (free) {
                        wire_rules[a_module] = last_rule.wire_in
                        updated_modules.push(a_module)
                    }
                }
            }

        }
    }

    console.log("updated_modules: ")
    console.log(updated_modules)

    // update configuration according to wiring rules
    for (var i = 0; i < updated_modules.length; ++i) {
        var module = updated_modules[i]
        var wire_into = wire_rules[module]
        var out_component = new_board_layout[module]
        var in_component = new_board_layout[wire_into]
        console.log("^^^^^^^^^^^^")
        console.log(new_board_layout)
        console.log(wire_into)
        console.log(new_board_layout[wire_into])
        console.log(components[in_component.t])
        console.log(op_types[components[in_component.t]])
        console.log("^^^^^^^^^^^^")
        if (op_types[components[out_component.t]] === "out" && wire_into !== null) {

            if (components[in_component.t].startsWith("Light")) {
                console.log('UPDATING WIRE CONNECTION')
                var val = out_component.v
                console.log(i)
                console.log(val)

                new_board_layout[wire_into].v = val
            }
        }

    }

    console.log("NEW BOARD LAYOUT")
    console.log(new_board_layout)

    for (var i = 0; i < num_modules; ++i) {
        m_board_layout[i] = Object.assign({},new_board_layout[i])
        if (Object.keys(m_board_layout[i]).length === 0) {
            m_board_layout[i] = null
        }
    }

    board_layout = new_board_layout.map(x => {
        if (x === null) {
            return x
        } else {
            x["type"] = components[x["t"]]
            delete x["t"]
            x["op_type"] = op_types[x["type"]]
            return x
        }
    })

    console.log(board_layout)
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')

    res.json({status: "success", board_layout: board_layout, m_board_layout: m_board_layout})
})



// remove an element from an array
function remove(array, element) {
    return array.filter(e => e !== element);
}

function change_key(o, old_key, new_key) {
    if (o !== null) {
        if (old_key !== new_key) {
            Object.defineProperty(o, new_key,
                Object.getOwnPropertyDescriptor(o, old_key));
            delete o[old_key];
        }
    }
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

app.get('/m-board-layout', (req,res) => {
    res.json(m_board_layout)
})


// accessing an exposed module
app.get('/expose/:module', function(req,res) {
    var module = req.params.module
    if (0 <= module && module < num_modules && expose_rules[module] !== null) {
        component = board_layout[module]
        res.json(component)
    } else {
        res.json({error: "module doesn't exist or is not exposed"})
    }
})

app.get('/board-layout', function(req,res) {
    res.json(board_layout)
})

app.get('/board-layouts-together', function(req,res) {
    res.json({d: board_layout, m: m_board_layout})
})

app.get('/board-info', function(req,res) {
    res.json({
        layout: board_layout,
        rules : {
            expose: expose_rules,
            listen: listen_rules,
            wire: wire_rules
        }
    })
})



function isInt(value) {
  return !isNaN(value) &&
         parseInt(Number(value)) == value &&
         !isNaN(parseInt(value, 10));
}

function valid_module(module) {
    return isInt(module) && 0 <= module && module < num_modules
}

// checks if module is filled
function live_module(module) {
    return valid_module(module) && board_layout[module] != null
}

app.post('/d-add-rule', function(req,res) {
    rule = req.body;
    if (rule.type === "expose") {
        if (live_module(rule.module) &&
            board_layout[rule.module].op_type === "out")
            //expose_rules[rule.module] === false)
        {
            var first_part
            if (process.env.NODE && ~process.env.NODE.indexOf("heroku")) {
                console.log("IM IN HEROKU")
                first_part = prependHttp(req.headers.host, {https: true})
            } else {
                first_part = prependHttp(req.headers.host)
            }
            url = urljoin(first_part,"expose","/" + rule.module)
            console.log("this url will be shortened")
            console.log(url)
            TinyURL.shorten(url, function(shortened) {
                expose_rules[rule.module] = shortened
                res.json({status: "success", url: shortened})
            })
        } else {
            res.status(400).json({status: "error", message: "exposing invalid module"})
        }
    } else if (rule.type === "listen") {
        if (live_module(rule.module) &&
            board_layout[rule.module].op_type === "in")
            //listen_rules[rule.module] === null)
        {
            rule.url = prependHttp(rule.url)
            console.log(rule.url)
            request.get(rule.url, (err,asdf,body) => {
                if (IsJsonString(body)) {
                    listen_rules[rule.module] = rule.url
                    res.json({status: "success"})
                } else {
                    console.log("INVALID URL")
                    res.status(400).json({status: "error", message: "listening to invalid url"})
                }
            })

        } else {
            res.status(400).json({status: "error", message: "listening to invalid module"})
        }
    } else if (rule.type === "wire") {
        if (live_module(rule.module_out) &&
            live_module(rule.module_in) &&
            board_layout[rule.module_out].op_type === "out" &&
            board_layout[rule.module_in].op_type === "in")
            //wire_rules[rule.module_out] === null)
        {
            for (var i = 0; i < num_modules; ++i) {
                if (wire_rules[i] == rule.module_in) {
                    wire_rules[i] = null
                }
            }
            wire_rules[parseInt(rule.module_out)] = parseInt(rule.module_in)
            res.json({status: "success"})
        } else {
            res.status(400).json({status: "error", message: "wiring invalid modules"})
        }
    } else {
        res.status(400).json({status: "error", message: "invalid rule type"})
    }
})

// module(s) in rule must be valid as in between 0 and 9 inclusive
app.post('/d-remove-rule', function(req,res) {
    rule = req.body;
    if (rule.type === "expose") {
        if (valid_module(rule.index))
        {
            expose_rules[rule.index] = null

            last[board_layout[rule.index].type].url_in = null

            res.json({status: "success"})
        } else {
            res.status(400).json({status: "error", message: "removing invalid expose rule"})
        }
    } else if (rule.type === "listen") {
        if (valid_module(rule.index))
        {
            listen_rules[rule.index] = null

            last[board_layout[rule.index].type].url_out = null

            res.json({status: "success"})
        } else {
            res.status(400).json({status: "error", message: "removing invalid listen rule"})
        }
    } else if (rule.type === "wire") {
        if (valid_module(rule.index))
        {
            wire_rules[rule.index] = null
            for (var i = 0; i < num_modules; ++i) {
                if (wire_rules[i] === parseInt(rule.index)) {
                    wire_rules[i] = null
                }
            }
            if (board_layout[rule.index].op_type === "out") {
                last[board_layout[rule.index].type].wire_in = null
            } else {
                last[board_layout[rule.index].type].wire_out = null
            }
            res.json({status: "success"})
        } else {
            res.status(400).json({status: "error", message: "wiring invalid modules"})
        }
    } else {
        res.status(400).json({status: "error", message: "invalid rule type"})
    }
    res.json({status: "success"})
})

app.get('/rules', (req,res) => {
    res.json({expose: expose_rules, listen: listen_rules, wire: wire_rules})
})

function check_listen_rules() {
    for (var i = 0; i < num_modules; i++) {
        var url = listen_rules[i]
        if (url !== null) {
            var storeI = i
            request.get(url, (err,res,body) => {
                if (IsJsonString(body)) {
                    let json = JSON.parse(body);
                    console.log(url)
                    console.log(json)
                    console.log(board_layout)
                    console.log(storeI)
                    console.log(board_layout[storeI])
                    if (board_layout[storeI] !== null) {
                        board_layout[storeI].v = json
                        m_board_layout[storeI].v = json
                        console.log(json)
                    } else {
                        console.log("invalid module listening")
                    }
                    // TODO: CHECK UPDATE BOARD_LAYOUT IS RIGHT
                } else {
                    console.log("module " + storeI + " is listening to a bad url")
                    console.log(url)
                }
            });
        }
    }
}


var listener = app.listen(process.env.PORT || 3000, function() {
    console.log('listening on ' + listener.address().port)
    setInterval(check_listen_rules, 500)
})
