function ajouterCarteAnalyse(titre, temps, distance, elevationData) {
    const analysisCards = document.getElementById('analysisCards');
    const analysisPanel = document.getElementById('analysisPanel');

    const card = document.createElement('div');
    card.className = 'card bg-gray-100 p-4 rounded shadow relative';

    const chartId = 'elevationChart_' + Math.random().toString(36).substr(2, 9);

    card.innerHTML = `
        <button class="close-btn absolute top-2 right-2 text-red-500">&times;</button>
        <h3 class="text-lg font-semibold">${titre}</h3>
        <p><b>Temps de parcours :</b> ${temps.toFixed(2)} jours</p>
        <p><b>Distance :</b> ${distance.toFixed(2)} km</p>
        <div class="popup-canvas-container" id="${chartId}"></div>
    `;

    analysisCards.appendChild(card);

    setTimeout(() => {
        const container = document.getElementById(chartId);
        const panelWidth = analysisPanel.clientWidth;
        const svgWidth = panelWidth - 40; 
        const svgHeight = 100; 
        const margin = { top: 10, right: 20, bottom: 10, left: 30 }; 
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = d3.select(`#${chartId}`)
            .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scalePoint()
            .domain(elevationData.map(point => `${point.lon}, ${point.lat}`))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(elevationData, d => d.z)])
            .nice()
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(`${d.lon}, ${d.lat}`))
            .y(d => y(d.z))
            .curve(d3.curveMonotoneX);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat('').ticks(5));

        svg.append("g")
            .call(d3.axisLeft(y).tickSize(-width).ticks(3))
            .call(g => g.select(".domain").remove());

        svg.append("path")
            .datum(elevationData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        svg.selectAll("circle")
            .data(elevationData)
            .enter().append("circle")
            .attr("cx", d => x(`${d.lon}, ${d.lat}`))
            .attr("cy", d => y(d.z))
            .attr("r", 2)
            .attr("fill", "steelblue");

    }, 300);

    // Close button for card
    const closeBtn = card.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        analysisCards.removeChild(card);
    });
}

function ajouterCarteAnalyseIsochrone(titre, indicators) {
    const analysisCards = document.getElementById('analysisCards');

    const card = document.createElement('div');
    card.className = 'card bg-gray-100 p-4 rounded shadow relative';

    const chartId = 'isochroneChart_' + Math.random().toString(36).substr(2, 9);

    card.innerHTML = `
        <button class="close-btn absolute top-2 right-2 text-red-500">&times;</button>
        <h3 class="text-lg font-semibold">${titre}</h3>
        <div id="${chartId}" class="chart-container" style="position: relative; height: 100px; width: 100%;"></div>
    `;

    analysisCards.appendChild(card);

    setTimeout(() => {
        const container = document.getElementById(chartId);
        const margin = { top: 10, right: 30, bottom: 30, left: 40 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = 100 - margin.top - margin.bottom;
    
        const svg = d3.select(`#${chartId}`).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
    
        const x = d3.scalePoint()
            .domain(indicators.map((_, index) => `Step ${index + 1}`))
            .range([0, width])
            .padding(0.5);
    
        const yArea = d3.scaleLinear()
            .domain([0, d3.max(indicators, d => d.area)])
            .nice()
            .range([height, 0]);
    
        const yPerimeter = d3.scaleLinear()
            .domain([0, d3.max(indicators, d => d.perimeter)])
            .nice()
            .range([height, 0]);
    
        const yCircularity = d3.scaleLinear()
            .domain([0, d3.max(indicators, d => d.circularity)])
            .nice()
            .range([height, 0]);
    
        const lineArea = d3.line()
            .x((_, index) => x(`Step ${index + 1}`))
            .y(d => yArea(d.area));
    
        const linePerimeter = d3.line()
            .x((_, index) => x(`Step ${index + 1}`))
            .y(d => yPerimeter(d.perimeter));
    
        const lineCircularity = d3.line()
            .x((_, index) => x(`Step ${index + 1}`))
            .y(d => yCircularity(d.circularity));
    
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));
    
        svg.append('g')
            .attr('class', 'y-axis-area')
            .call(d3.axisLeft(yArea).ticks(5))
            .append('text')
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '-3.5em')
            .attr('text-anchor', 'end')
            .text('Surface (m²)');
    
        svg.append('g')
            .attr('class', 'y-axis-perimeter')
            .attr('transform', `translate(${width},0)`)
            .call(d3.axisRight(yPerimeter).ticks(5))
            .append('text')
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .attr('y', -6)
            .attr('dy', '3.5em')
            .attr('text-anchor', 'end')
            .text('Périmètre (m)');
    
        svg.append('g')
            .attr('class', 'y-axis-circularity')
            .attr('transform', `translate(${width + 40},0)`)
            .call(d3.axisRight(yCircularity).ticks(5))
            .append('text')
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .attr('y', -6)
            .attr('dy', '7em')
            .attr('text-anchor', 'end')
            .text('Circularité');
    
        svg.append('path')
            .datum(indicators)
            .attr('class', 'line-area')
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 1.5)
            .attr('d', lineArea);
    
        svg.append('path')
            .datum(indicators)
            .attr('class', 'line-perimeter')
            .attr('fill', 'none')
            .attr('stroke', 'green')
            .attr('stroke-width', 1.5)
            .attr('d', linePerimeter);
    
        svg.append('path')
            .datum(indicators)
            .attr('class', 'line-circularity')
            .attr('fill', 'none')
            .attr('stroke', 'orange')
            .attr('stroke-width', 1.5)
            .attr('d', lineCircularity);
    
        // legend in chart d3js
        const legendData = [
            { label: 'Surface (m²)', color: 'steelblue' },
            { label: 'Périmètre (m)', color: 'green' },
            { label: 'Circularité', color: 'orange' }
        ];
    
        const legend = svg.selectAll('.legend')
            .data(legendData)
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);
    
        legend.append('rect')
            .attr('x', width - 18)
            .attr('width', 18)
            .attr('height', 18)
            .style('fill', d => d.color);
    
        legend.append('text')
            .attr('x', width - 24)
            .attr('y', 9)
            .attr('dy', '.35em')
            .style('text-anchor', 'end')
            .text(d => d.label);
    
    }, 300);
    
    // Close button for what div ?
    const closeBtn = card.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        analysisCards.removeChild(card);
    });
}