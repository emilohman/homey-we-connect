'use strict';

const Homey = require('homey');
const Connect = require('../../lib/connect');

class MyDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      // Example device data, note that `store` is optional
      // {
      //   name: 'My Device',
      //   data: {
      //     id: 'my-device',
      //   },
      //   store: {
      //     address: '127.0.0.1',
      //   },
      // },
    ];
  }

  async onPair(session) {
    let username = "";
    let password = "";
    let pin = "";

    session.setHandler("login", async (data) => {
      username = data.username;
      password = data.password;

      // return true to continue adding the device if the login succeeded
      // return false to indicate to the user the login attempt failed
      // thrown errors will also be shown to the user
      return true;
    });

    session.setHandler("pincode", async (pincode) => {
      pin = pincode;

      return true;
    });

    session.setHandler("list_devices", async () => {
      const con = new Connect({ username, password, pin, logger: this.homey.app.logger });

      await con.login();
      const vehicles = await con.getVehicles();

      const devices = [];

      for (let i = 0, length = vehicles.length; i < length; i++) {
        const vehicle = vehicles[i];

        const homeRegion = await con.getHomeRegion(vehicle);
        const data = await con.getVehicleData(vehicle);

        devices.push({
          name: data.carportData.modelName,
          data: {
            id: vehicle,
            homeRegion,
            username,
            password,
            pin: pin.join('')
          }
        });
      }

      return devices;
    });
  }
}

module.exports = MyDriver;
