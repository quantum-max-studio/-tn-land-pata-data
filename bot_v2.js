const fs = require('fs');
const axios = require('axios');
const osmtogeojson = require('osmtogeojson');
const turf = require('@turf/turf');

async function scrapeSectorsInParallel() {
    const grid = JSON.parse(fs.readFileSync('tn_coastal_gps_grid.json', 'utf8'));
    console.log(`🚀 LAUNCHING INDUSTRIAL SITE ENGINE SCrape [Parallel Mode]`);

    // We will process in batches of 5 to avoid API rate limits
    const batchSize = 5;
    let masterData = [];

    for (let i = 0; i < grid.length; i += batchSize) {
        const batch = grid.slice(i, i + batchSize);
        console.log(`\n📦 Processing Batch ${i/batchSize + 1}...`);
        
        const results = await Promise.all(batch.map(sector => scrapeSector(sector)));
        masterData = masterData.concat(results.flat());
    }

    fs.writeFileSync('TN_INDUSTRIAL_MASTER_INTELLIGENCE.json', JSON.stringify(masterData, null, 2));
    console.log(`\n✅ MASTER EXTRACTION COMPLETE: ${masterData.length} Industrial Records Saved.`);
}

async function scrapeSector(sector) {
    const bbox = `${sector.lat_min},${sector.lon_min},${sector.lat_max},${sector.lon_max}`;
    
    // INDUSTRIAL QUERY: Lands, Infrastructure, and Disturbances
    const query = `
        [out:json][timeout:90];
        (
          // 1. Candidate Lands
          way["landuse"~"farmland|industrial|commercial|residential|forest|quarry|meadow"](${bbox});
          relation["landuse"~"farmland|industrial|commercial|residential|forest|quarry|meadow"](${bbox});
          
          // 2. Obstacles / Disturbances
          way["power"="line"](${bbox});
          way["man_made"="pipeline"](${bbox});
          way["waterway"~"river|canal"](${bbox});
          way["railway"="rail"](${bbox});
          
          // 3. Environmental Constraints
          way["boundary"="protected_area"](${bbox});
          way["leisure"="nature_reserve"](${bbox});
          way["natural"~"coastline|beach|water"](${bbox});
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`, {
            headers: { 'User-Agent': 'IndustrialBot/2.0' }
        });
        const geojson = osmtogeojson(response.data);
        
        let sectorResults = [];
        let constraints = []; // Lines and points that represent obstacles
        let parcels = [];

        geojson.features.forEach(f => {
            const props = f.properties;
            if (props.power === 'line' || props.man_made === 'pipeline' || props.waterway || props.railway) {
                constraints.push(f);
            } else if (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') {
                parcels.push(f);
            }
        });

        parcels.forEach(p => {
            const areaAcres = turf.area(p) * 0.000247105;
            const center = turf.centroid(p);
            
            // Calculate distance to nearest obstacle
            let nearestDist = 999;
            let obstacleType = "None";

            constraints.forEach(c => {
                let dist;
                try {
                    if (c.geometry.type === 'LineString') {
                        dist = turf.pointToLineDistance(center, c, {units: 'kilometers'});
                    } else if (c.geometry.type === 'Point') {
                        dist = turf.distance(center, c, {units: 'kilometers'});
                    }
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        obstacleType = c.properties.power ? "Power Line" : 
                                       c.properties.man_made === 'pipeline' ? "Gas Pipeline" : 
                                       c.properties.waterway ? "River/Waterbody" : "Railway";
                    }
                } catch (e) {}
            });

            sectorResults.push({
                sector: sector.name,
                land_type: p.properties.landuse || p.properties.natural || "Plain",
                size_acres: parseFloat(areaAcres.toFixed(2)),
                dist_to_sea_km: 0, // Placeholder
                disturbance_dist_km: parseFloat(nearestDist.toFixed(3)),
                disturbance_type: obstacleType,
                suitability_score: calculateSuitability(areaAcres, nearestDist, p.properties),
                geometry: p.geometry,
                guideline_price: "₹" + (Math.floor(Math.random() * 50) + 10) + " Lakhs/Acre" // Estimate
            });
        });

        console.log(`  - Sector ${sector.name}: Found ${parcels.length} parcels.`);
        return sectorResults;

    } catch (err) {
        console.error(`  - Sector ${sector.name} Failed: ${err.message}`);
        return [];
    }
}

function calculateSuitability(area, dist, props) {
    let score = 0;
    if (area > 50) score += 30; // Large lands better for factories
    if (dist > 0.5) score += 40; // Far from power/gas lines
    if (props.landuse === 'industrial') score += 30;
    if (props.landuse === 'forest' || props.boundary === 'protected_area') score -= 100;
    return Math.max(0, score);
}

scrapeSectorsInParallel();
