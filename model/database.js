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
    }

    getPlayerData(player_name) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').findOne({ player_name: player_name }, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            })
        })
    }

    registerNewPlayer(player_name) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').insertOne({
                player_name: player_name,
                created: new Date(),
                stats: {
                    win: 0,
                    hit: 0,
                    miss: 0,
                    sunk: 0
                },
                match: []
            }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        })
    }

    createNewMatch(player_name, new_match) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').update({ player_name: player_name }, { $push: { "match": new_match } }, (err, data) => {
                if (err) return reject(err);
                resolve(data.result.n > 0 ? data : false);
            })
        })
    }

    deletePlayer(player_name) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').remove({ player_name: player_name }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    }

    endMatch(player_name) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').update({ player_name: player_name, "match.ending": false }, { $set: { "match.$.ending": true } }, (err, data) => {
                if (err) return reject(err);
                resolve(data.result.n > 0 ? data : false);
            })
        })
    }

    checkShooted(player_name, x, y) {
        return new Promise((resolve, reject) => {
            this.getShootHistory(player_name).then(shoot_history => {
                let shooted = shoot_history.filter(shoot => (shoot.x == x) && (shoot.y == y));
                resolve(shooted.length > 0);
            }, err => reject(err));
        })
    }

    getShootHistory(player_name) {
        return new Promise((resolve, reject) => {
            this.getMatchData(player_name).then(match => {
                resolve(match ? match.shooted : undefined);
            }, err => reject(err));
        })
    }

    getMatchData(player_name) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').findOne({ player_name: player_name, "match.ending": false }, (err, data) => {
                if (err) return reject(err);
                resolve(data && data.match ? data.match.filter(match => !match.ending)[0] : undefined);
            })
        })
    }

    getHistoryMatch(player_name) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').findOne({ player_name: player_name }, (err, data) => {
                if (err) return reject(err);
                resolve(data && data.match ? data.match.filter(match => match.ending) : undefined);
            })
        })
    }

    getPlayerStatus(player_name) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').findOne({ player_name: player_name }, (err, data) => {
                if (err) return reject(err);
                resolve(data ? data.stats : undefined);
            })
        })
    }


    updateShootedShip(player_name, ocean) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').update({ player_name: player_name, "match.ending": false },
                { $set: { "match.$.ocean": ocean } }, (err, data) => {
                    if (err) return reject(err);
                    resolve(data.result.n > 0 ? data : false);
                })
        })
    }

    addShootData(player_name, x, y, hit) {
        return new Promise((resolve, reject) => {
            let shoot_data = {
                x: parseInt(x),
                y: parseInt(y),
                hit,
                time: new Date()
            }
            let hit_type = hit ? "stats.hit" : "stats.miss";
            this.db.collection('battleship').update({ player_name: player_name, "match.ending": false },
                {
                    $push: { "match.$.shooted": shoot_data },
                    $inc: { "match.$.turn": 1, "stats.hit": hit ? 1 : 0, "stats.miss": hit ? 0 : 1 }
                }, (err, data) => {
                    if (err) return reject(err);
                    resolve(data.result.n > 0 ? data : false);
                })
        })
    }

    updateShips(player_name, ships) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').update({ player_name: player_name, "match.ending": false },
                { $set: { "match.$.ships": ships }, $inc: { "stats.sunk": 1 } }, (err, data) => {
                    if (err) return reject(err);
                    resolve(data.result.n > 0 ? data : false);
                })
        })
    }

    updateOcean(player_name, ocean) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').update({ player_name: player_name, "match.ending": false },
                { $set: { "match.$.ocean": ocean } }, (err, data) => {
                    if (err) return reject(err);
                    resolve(data.result.n > 0 ? data : false);
                })
        })
    }

    decreaseShipLeft(player_name) {
        return new Promise((resolve, reject) => {
            this.db.collection('battleship').update({ player_name: player_name, "match.ending": false },
                { $inc: { "match.$.ship_left": -1 } }, (err, data)=>{
                    if (err) return reject(err);
                    resolve(data.result.n > 0 ? data : false);
                })
        });
    }

    increaseWin(player_name) {
        this.db.collection('battleship').update({ player_name: player_name },
            { $inc: { "stats.win": 1 } })
    }
}

module.exports = mongodb;