// Set up SVG dimensions
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

// Initialize scales and axes
const xScale = d3.scaleBand().range([0, width]).padding(0.1);
const yScale = d3.scaleLinear().range([height, 0]);

const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`);

const yAxis = svg.append("g");

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

// Load data from CSV
d3.csv("condition.csv").then(data => {
    // Convert tremor_severity to numbers
    data.forEach(d => {
        d.tremor_severity = +d.tremor_severity;
    });

    // Populate the dropdown with unique task names
    const taskNames = [...new Set(data.map(d => d.task_name))];
    const taskFilter = d3.select("#task-filter");
    taskNames.forEach(task => {
        taskFilter.append("option")
            .attr("value", task)
            .text(task);
    });

    // Initial render with all data
    updateChart(data);

    // Add event listener to the dropdown
    taskFilter.on("change", function() {
        const selectedTask = this.value;
        const filteredData = selectedTask === "All" 
            ? data 
            : data.filter(d => d.task_name === selectedTask);
        updateChart(filteredData);
    });
}).catch(error => {
    console.error("Error loading the CSV data:", error);
});

// Function to update the chart
function updateChart(data) {
    // Group data by condition and calculate mean tremor severity
    const groupedData = d3.group(data, d => d.condition);
    const aggregatedData = Array.from(groupedData, ([condition, values]) => ({
        condition,
        tremor_severity: d3.mean(values, d => d.tremor_severity)
    }));

    // Update scales
    xScale.domain(aggregatedData.map(d => d.condition));
    yScale.domain([0, d3.max(aggregatedData, d => d.tremor_severity)]);

    // Update bars
    const bars = svg.selectAll(".bar")
        .data(aggregatedData);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .merge(bars)
        .attr("x", d => xScale(d.condition))
        .attr("y", d => yScale(d.tremor_severity))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.tremor_severity))
        .on("mouseover", function(event, d) {
            d3.select(this)
                .style("fill", "orange");
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .style("fill", "steelblue");
        });

    bars.exit().remove();

    // Update axes
    xAxis.call(d3.axisBottom(xScale));
    yAxis.call(d3.axisLeft(yScale));
}