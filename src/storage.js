const fs = require('fs')

const DEFAULT_STATE = {
  shown: []
}

class Storage {
  constructor(website){
    this.website = website
    this.filePath = `./states/${website}.json`
  }

  update(newState) {
    fs.writeFileSync(this.filePath, JSON.stringify(newState));
  }

  get() {
    if (!fs.existsSync(this.filePath)) {
      this.update(DEFAULT_STATE)
    }
    
    return JSON.parse(fs.readFileSync(this.filePath))
  }
}

module.exports = Storage