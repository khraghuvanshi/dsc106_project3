const svgWidth = 800;
const svgHeight = 600;
const margin = { top: 50, right: 30, bottom: 50, left: 60 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data from CSV
d3.csv("merged_data.csv").then(data => {
    // Convert tremor_severity to numbers
    data.forEach(d => {
        d.tremor_severity = +d.tremor_severity;
    });

    // Set up scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.condition))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.tremor_severity)])
        .range([height, 0]);

    // Create bars
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.condition))
        .attr("y", d => yScale(d.tremor_severity))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.tremor_severity));

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Condition");

    // Add y-axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .style("text-anchor", "middle")
        .text("Tremor Severity");
}).catch(error => {
    console.error("Error loading the CSV data:", error);
});