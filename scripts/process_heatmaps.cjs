const fs = require('fs');
const path = require('path');

const scraperDir = '/Users/avahu/projects/twitter-scraper/data';
const accounts = ['SydneyDaddy1', 'CaoChangqing', 'usa912152217'];

let allData = [];
let globalMax = 0;
let months = []; // X-axis headers

// The CSV format:
// ,2024-02,2024-03,2024-04,...
// Mon,25,102,66,...
// Tue,...

accounts.forEach(account => {
    const csvPath = path.join(scraperDir, account, 'timeline', 'weekday_month_heatmap.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("Missing file:", csvPath);
        return;
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    
    if (lines.length < 8) return; // Expect header + 7 days
    
    const headers = lines[0].split(',').map(s => s.trim());
    if (months.length === 0) {
        months = headers.slice(1); // skip the first empty column
    }
    
    let daysData = {};
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(s => s.trim());
        const day = row[0];
        const values = row.slice(1).map(v => parseInt(v) || 0);
        
        daysData[day] = values;
        
        // Compute max
        const rowMax = Math.max(...values);
        if (rowMax > globalMax) globalMax = rowMax;
    }
    
    allData.push({
        account: account,
        days: daysData
    });
});

const outputData = {
    months: months,
    globalMax: globalMax,
    accounts: allData
};

const outDir = path.join(__dirname, '../src/lib/data');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'heatmapData.json'), JSON.stringify(outputData, null, 2));

console.log('Successfully processed heatmap data. Global Max:', globalMax);
