'use strict';

const Homey = require('homey');

class MyApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MyApp has been initialized');

    this.homey.settings.set('logger', JSON.stringify({ logs: [] }));

    const saveLog = (type, message) => {
      const s = this.homey.settings.get('logger');
      const log = s ? JSON.parse(s) : {logs: []};

      log.logs.push({time: new Date().toLocaleString(), message, type});

      this.homey.settings.set('logger', JSON.stringify(log));
    };

    this.logger = {
      debug: (message) => {
        console.debug(message);
        // saveLog('debug', message);
      },
      log: (message) => {
        console.log(message);
        // saveLog('log', message);
      },
      warn: (message) => {
        console.warn(message);
        // saveLog('warn', message);
      },
      info: (message) => {
        console.info(message);
        // saveLog('info', message);
      },
      error: (message) => {
        console.error(message);
        saveLog('error', message);
      }
    };
  }
}

module.exports = MyApp;
