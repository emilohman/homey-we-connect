'use strict';

const Homey = require('homey');
const Connect = require('../../lib/connect');

class MyDevice extends Homey.Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.homey.app.logger.log('MyDevice has been initialized');
    this.homey.app.logger.log(this.getData());

    this.registerCapabilityListener("onoff.window_heating", async value => {
      try {
        await this.prepareConnection();

        await this.connection.setWindowHeating(value);
      } catch(error) {
        this.homey.app.logger.error(error);
      }

      return true;
    });

    this.registerCapabilityListener("onoff.climatisation", async value => {
      try {
        await this.prepareConnection();

        await this.connection.setClimatisation(value);
      } catch(error) {
        this.homey.app.logger.error(error);
      }

      return true;
    });

    this.registerCapabilityListener("target_temperature", async value => {
      try {
        await this.prepareConnection();

        await this.connection.setClimatisationTemperature(value);
      } catch(error) {
        this.homey.app.logger.error(error);
      }

      return true;
    });

    const toggleClimatisation = this.homey.flow.getActionCard('toggle_climatisation');
    toggleClimatisation.registerRunListener(async ( args, state ) => {
      await this.triggerCapabilityListener('onoff.climatisation', args.state === 'on');
    });

    const toggleWindowHeating = this.homey.flow.getActionCard('toggle_window_heating');
    toggleWindowHeating.registerRunListener(async ( args, state ) => {
      await this.triggerCapabilityListener('onoff.window_heating', args.state === 'on');
    });

    await this.startPolling();
  }

  async prepareConnection() {
    if (!this.connection) {
      this.homey.app.logger.log('prepareConnection');

      this.connection = new Connect({
        username: this.getData().username,
        password: this.getData().password,
        pin: this.getData().pin,
        vin: this.getData().id,
        homeRegion: this.getData().homeRegion,
        logger: this.homey.app.logger
      });
    }

    this.homey.app.logger.log('Login');

    await this.connection.login();
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');

    await this.startPolling();
  }

  async startPolling() {
    try {
      await this.prepareConnection();

      this.homey.app.logger.log('Get data');

      const chargingStatus = await this.connection.getCharging();
      const climate = await this.connection.getClimate();
      const position = await this.connection.getPosition();

      // this.log(climate);

      let chargeCableStatus;

      if (chargingStatus.plugStatus === 'connected') {
        if (chargingStatus.energyFlow === 'on') {
          chargeCableStatus = 'Connected, with Power';
        } else {
          chargeCableStatus = 'Connected, no Power';
        }
      } else {
        chargeCableStatus = 'Disconnected';
      }

      await this.setCapabilityValue('measure_battery', chargingStatus.batteryStatus);
      await this.setCapabilityValue('charge_cable_status', chargeCableStatus);
      await this.setCapabilityValue('measure_temperature.outside', climate.outdoorTemperature / 10 - 273);
      await this.setCapabilityValue('target_temperature', climate.targetTemperature / 10 - 273);
      await this.setCapabilityValue('status.online', true);
      await this.setCapabilityValue('heating.window_heating_state_front', climate.windowHeatingStateFront === 'on');
      await this.setCapabilityValue('heating.window_heating_state_rear', climate.windowHeatingStateRear === 'on');
      await this.setCapabilityValue('heating.climatisation_state', climate.climatisationState === 'on');
      await this.setCapabilityValue('onoff.window_heating', climate.windowHeatingStateFront === 'on');
      await this.setCapabilityValue('onoff.climatisation', climate.climatisationState === 'on');

      // await this.connection.setClimatisationTemperature(21);
      // await this.connection.setClimatisation(false);
      // await this.connection.setWindowHeating(false);
      // await this.connection.setLock(true); // Not working
      this.homey.app.logger.log('Get data: done');
    } catch(error) {
      this.homey.app.logger.error(error);
      await this.setCapabilityValue('status.online', false).catch(this.homey.app.logger.error);
    }

    this.homey.clearTimeout(this.pollingIndex);
    this.pollingIndex = this.homey.setTimeout(async () => {
      await this.startPolling();
    }, 120000);
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
    this.homey.clearTimeout(this.pollingIndex);
  }
}

module.exports = MyDevice;
