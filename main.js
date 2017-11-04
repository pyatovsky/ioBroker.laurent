/**
 *
 * template adapter
 *
 *
 *  file io-package.json comments:
 *
 *  {
 *      "common": {
 *          "name":         "template",                  // name has to be set and has to be equal to adapters folder name and main file name excluding extension
 *          "version":      "0.0.0",                    // use "Semantic Versioning"! see http://semver.org/
 *          "title":        "Node.js template Adapter",  // Adapter title shown in User Interfaces
 *          "authors":  [                               // Array of authord
 *              "name <mail@template.com>"
 *          ]
 *          "desc":         "template adapter",          // Adapter description shown in User Interfaces. Can be a language object {de:"...",ru:"..."} or a string
 *          "platform":     "Javascript/Node.js",       // possible values "javascript", "javascript/Node.js" - more coming
 *          "mode":         "daemon",                   // possible values "daemon", "schedule", "subscribe"
 *          "schedule":     "0 0 * * *"                 // cron-style schedule. Only needed if mode=schedule
 *          "loglevel":     "info"                      // Adapters Log Level
 *      },
 *      "native": {                                     // the native object is available via adapter.config in your adapters code - use it for configuration
 *          "test1": true,
 *          "test2": 42
 *      }
 *  }
 *
 */


// Это всегда должно быть (вызывает обязательный файл)
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils

// Обязательно - эта штука создает адаптер (объект)
var adapter = utils.adapter('laurent');

var request = require('request');

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

//Функция для переключения реле - отослать команду
function httpRelaySwitch (relayNumber, mes)
{
    request ('http://'+adapter.config.IP+'/cmd.cgi?cmd=REL,'+relayNumber+','+mes);
} 

//Функция для переключения выходной линии - отослать команду
function httpOutlineSwitch (outlineNumber, mes)
{
    request ('http://'+adapter.config.IP+'/cmd.cgi?cmd=OUT,'+outlineNumber+','+mes);
}

function relaysProcessing (relayString)
{
	var relayTable = relayString.split("");
		
	for (var i = 1; i <= adapter.config.numRelays; i++)
	{
		adapter.setState('relay'+i, Boolean(parseInt(relayTable[i-1])), true);
	}
}

function outlineProcessing (outlineString)
{
	var outlineTable = outlineString.split("");
		
	for (var i = 1; i <= adapter.config.numOutlines; i++)
	{
		adapter.setState('outline'+i, Boolean(parseInt(outlineTable[i-1])), true);
	}
}

function inlineProcessing (inlineString)
{
	var inlineTable = inlineString.split("");
		
	for (var i = 1; i <= adapter.config.numInlines; i++)
	{
		adapter.setState('inline'+i, Boolean(parseInt(inlineTable[i-1])), true);
	}
}

//Подписываемся на случай изменения состояния (событие stateChange)
adapter.on('stateChange', StateProcessing);

//Объявляем переменные для сравнения (снаружи функции)
var relayStringPrev;
var outlineStringPrev;
var inlineStringPrev;

function StateProcessing(id, state)
{
	if (state.ack === true) //Если получено в результате опроса
	{
		if (id.includes("relayString") && state.val != relayStringPrev) //Если название изменившегося объекта содержит такое слово, и не равно предыдущему значению
		{
			relaysProcessing (state.val);
			relayStringPrev = state.val;
		}
		
		else if (id.includes("outlineString") && state.val != outlineStringPrev)
		{
			outlineProcessing (state.val);
			outlineStringPrev = state.val;
		}
		
		else if (id.includes("inlineString") && state.val != inlineStringPrev)
		{
			inlineProcessing (state.val);
			inlineStringPrev = state.val;
		}
	}
	
	else if (state.ack === false) //Если это команды
	{
		if (id.includes("relay")) //Если это реле
		{
			var reg = "relay([1-9])"; //Регулярное выражение для нахождения номера
			httpRelaySwitch (id.match(reg)[1],(+state.val)); //(+ конвертирует bul в число)
		}
		
		else if (id.includes("outline")) //Если это выходная линия
		{
			var reg = "outline([1-9]*)";
			httpOutlineSwitch (id.match(reg)[1],(+state.val));
		}
	}
}

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    if (typeof obj == 'object' && obj.message) {
        if (obj.command == 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// Драйвер стартует и вызывает функцию main
adapter.on('ready', function () {
    main();
});

//Функция для извлечения значений из XML
function XMLElement(tag, xmlcontent)
{
    var reg = "<"+tag+">(.*)</"+tag+">";
    return xmlcontent.match(reg)[1];
}

function statusProcessing(error, response, body)
{
    if (!error && response.statusCode == 200)
    {
        adapter.setState('info.connection', true, true);
        
		if (adapter.config.enableTemperature === true)
		{	
			//Температура = Конвертируем строку в число (запрошенную по тегу temp в ответе Лорана).округляем (до 1 знака после запятой)
			var newTemperature = parseFloat(XMLElement ("temp", body)).toFixed(1);
			adapter.setState('temperature', parseFloat(newTemperature), true);
		}
           
        //Время Лорана
		if (adapter.config.enableSystemTime === true)
		{
			adapter.setState('systemTime', parseInt(XMLElement ("systime", body)), true);
		}	
		
        //Строка состояния реле
		adapter.setState('relayString', XMLElement ("rele", body), true);
            
        //Строка состояния входов
        adapter.setState('inlineString', XMLElement ("in", body), true);
                
        //Строка состояния выходов
        adapter.setState('outlineString', XMLElement ("out", body), true);
    }
    else
    {
        adapter.setState('info.connection', false, true);
    }
}

//Главная периодическая функция (опрос по http)
function mainPoll ()
{
    request ('http://'+adapter.config.IP+'/state.xml', statusProcessing);
}

// Функция, которая стартует
function main()
{
	//Переменная для отображения статуса соединения
	adapter.setState('info.connection', false, true);
	
	//Запускаем опрос с определенным периодом
	var timerID = setInterval(mainPoll, adapter.config.period);    
	
	//Информация о старте
	adapter.log.info(adapter.config.comment+' starts with: IP - '+adapter.config.IP+'; Period - '+adapter.config.period+'; Use uptime - '+adapter.config.enableSystemTime+'; Use temperature - '+adapter.config.enableTemperature+'; Use relays - '+adapter.config.enableRelays+' ('+adapter.config.numRelays+')'+'; Use Outlines - '+adapter.config.enableOutlines+' ('+adapter.config.numOutlines+')'+'; Use Inlines - '+adapter.config.enableInlines+' ('+adapter.config.numInlines+')');
	
	if (adapter.config.enableTemperature === true)
	{	
		adapter.setObject('temperature', {
			type: 'state',
			common: {
				name: 'temperature',
				type: 'number',
				role: 'value.temperature',
				read: 'true',
				unit: '°C'
			},
			native: {}
		});
	}
	
	if (adapter.config.enableSystemTime === true)
	{
		adapter.setObject('systemTime', {
			type: 'state',
			common: {
				name: 'systemTime',
				type: 'number',
				role: 'value',
				read: 'true'
			},
			native: {}
		});
	}	
	
	//Создаем объекты для для входных линий
	if (adapter.config.enableInlines === true)
	{
		//Вспомогательная строка
		adapter.setObject('inlineString', {
			type: 'state',
			common: {
				name: 'inlineString',
				type: 'string',
				role: 'text',
				read: 'true',
				write: 'true'
			},
			native: {}
		});
	
		for (var i = 1; i <= adapter.config.numInlines; i++)
		{
  			adapter.setObject('inline'+i, {
				type: 'state',
				common: {
					name: 'inline'+i,
					type: 'boolean',
					role: 'switch',
					read: 'true'
				},
				native: {}
			});
		
		};
		
	}
	
	//Создаем объекты для для выходных линий
	if (adapter.config.enableOutlines === true)
	{
		//Вспомогательная строка
		adapter.setObject('outlineString', {
			type: 'state',
			common: {
				name: 'outlineString',
				type: 'string',
				role: 'text',
				read: 'true',
				write: 'true'
			},
			native: {}
		});
				
		for (var i = 1; i <= adapter.config.numOutlines; i++)
		{
  			adapter.setObject('outline'+i, {
				type: 'state',
				common: {
					name: 'outline'+i,
					type: 'boolean',
					role: 'switch',
					read: 'true',
					write: 'true'
				},
				native: {}
			});
		
		};
				
	}
	
	//Создаем объекты для реле
	if (adapter.config.enableRelays === true)
	{
		//Вспомогательная строка
		adapter.setObject('relayString', {
			type: 'state',
			common: {
				name: 'relayString',
				type: 'string',
				role: 'text',
				read: 'true',
				write: 'true'
			},
			native: {}
		});
		
		for (var i = 1; i <= adapter.config.numRelays; i++)
		{
  			adapter.setObject('relay'+i, {
				type: 'state',
				common: {
					name: 'relay'+i,
					type: 'boolean',
					role: 'switch',
					read: 'true',
					write: 'true'
				},
				native: {}
			});
		
		};
				
	}
	
    
	//Подписываемся на состояния всех объектов - указанных!
	if (adapter.config.enableOutlines === true)
	{
		adapter.subscribeStates('outline*');
	}
    
	if (adapter.config.enableRelays === true)
	{
		adapter.subscribeStates('relay*');
	}

	if (adapter.config.enableInlines === true)
	{
		adapter.subscribeStates('inline*');
	}
	
	
	//adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

 

}

