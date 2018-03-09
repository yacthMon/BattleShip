let mongo = require('mongodb').MongoClient;
class mongodb {
    constructor(config, callback) {
        this.config = config;
        mongo.connect("mongodb://" + config.user + ":" + config.password + "@" + config.ip + ":" + config.port + "/" + config.database + "?authMechanism=DEFAULT&authSource=" + config.database, (err, client) => {
            if (err) {
                return callback ? callback(err) : err;
            }
            if (callback) callback();
            client.close();
        })
    }

    async connect(db_name) {
        let _this = this;
        return new Promise((resolve, reject) => {
            if (_this.db) {
                resolve();
            } else {
                mongo.connect("mongodb://" + this.config.user + ":" + this.config.password + "@" + this.config.ip + ":" + this.config.port + "/" + this.config.database + "?authMechanism=DEFAULT&authSource=" + this.config.database)
                    .then((client) => {
                        _this.db = client.db(db_name);
                        resolve(true);
                    }, (err) => {
                        reject(err.message);
                    }
                    );
            }
        })
    }

    close() {
        this.db.close();
        // delete this;
    }

    getPlayerData(player_name) {
        return new Promise((resolve,reject)=>{
            this.db.collection('battleship').findOne({ player_name: player_name }, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            })
        })
    }

    registerNewPlayer(player_name){
        return new Promise((resolve, reject)=>{
            this.db.collection('battleship').insertOne({
                player_name : player_name,
                created : new Date(),
                stats: {
                    game : 0,
                    hits : 0,
                    miss : 0,
                    sunk : 0
                },
                match: []
            }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        })
    }

    createNewMatch(player_name, new_match){
        return new Promise((resolve, reject)=>{
            this.db.collection('battleship').update({player_name:player_name}, { $push: { "match": new_match } }, (err, data) => {
                if (err) return reject(err);
                resolve(data.result.n > 0 ? data : false);
            })
        })
    }

}

module.exports = mongodb;