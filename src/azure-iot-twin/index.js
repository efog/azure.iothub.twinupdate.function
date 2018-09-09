const Registry = require("azure-iothub").Registry;

class AzureIoTTwinService {

    /**
     * Creates an instance of AzureIoTTwinService.
     * @memberof AzureIoTTwinService
     */
    constructor() {
        this._connectionString = process.env.AzureIoTHubConnectionString;
    }
    
    /**
     * Gets Azure IoT Hub registry
     */
    get registry() {
        if (!this._registry) {
            this._registry = Registry.fromConnectionString(this._connectionString);
        }
        return this._registry;
    }

    /**
     * Apply twin patch to devices matching class
     *
     * @param {*} deviceClass class to patch twin
     * @param {*} twinPatch patch to apply
     * @returns {Promise} execution prommise of apply patch
     * @memberof AzureIoTTwinService
     */
    applyTwinPatchToClass(deviceClass, twinPatch) {
        return this.queryTwinsByDeviceClass(deviceClass)
            .then((twins) => {
                return this.updateTwins(twins, twinPatch);
            });
    }

    /**
     * Updates twins with patch
     *
     * @param {*} twins twins to patch
     * @param {*} twinPatch patch to apply
     * @returns {Promise} twins patching execution promise
     * @memberof AzureIoTTwinService
     */
    updateTwins(twins, twinPatch) {
        const patches = twins.map((twin) => {
            const promise = new Promise((resolve, reject) => { 
                twin.update(twinPatch, (err, twinUpdate) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve(twinUpdate);
                    }
                });
            });
            return promise;
        });
        return Promise.all(patches);
    }

    /**
     * Queries the twin registry for matching devices by class
     *
     * @param {*} deviceClass device class to match
     * @returns {Promise} Query execution promise
     * @memberof AzureIoTTwinService
     */
    queryTwinsByDeviceClass(deviceClass) {
        const promise = new Promise((resolve, reject) => {            
            const query = this.registry.createQuery(`SELECT * FROM devices WHERE tags.class = '${deviceClass}'`, 100);
            const twins = [];
            const onResults = function(err, results) {
                if (err) {
                    console.error(`Failed to fetch the results: ${err.message}`);
                    reject(err);
                } else {
                    // Do something with the results
                    results.forEach(function(twin) {
                        twins.push(twin);
                    });              
                    if (query.hasMoreResults) {
                        query.nextAsTwin(onResults);
                    }
                    else {
                        resolve(twins);
                    }
                }
            };
            query.nextAsTwin(onResults);
        });
        return promise;
    }
}
module.exports = new AzureIoTTwinService();