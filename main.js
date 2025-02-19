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

// Color scale for different movements
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Load data from CSV
d3.csv("condition.csv").then(data => {
    // Convert tremor_severity to numbers
    data.forEach(d => {
        d.tremor_severity = +d.tremor_severity;
    });

    // Get unique task names for the dropdown
    const taskNames = [...new Set(data.map(d => d.task_name))];
    const taskFilter = d3.select("#task-filter");
    taskNames.forEach(task => {
        taskFilter.append("option")
            .attr("value", task)
            .text(task);
    });

    // Set a fixed y-axis domain based on the full data range
    const maxSeverity = d3.max(data, d => d.tremor_severity);
    yScale.domain([0, maxSeverity]);

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

    // Update x-scale domain
    xScale.domain(aggregatedData.map(d => d.condition));

    // Update bars with transitions
    const bars = svg.selectAll(".bar")
        .data(aggregatedData, d => d.condition);

    // Enter new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.condition))
        .attr("y", height) // Start from the bottom
        .attr("width", xScale.bandwidth())
        .attr("height", 0) // Start with zero height
        .attr("fill", d => colorScale(d.condition)) // Color by condition
        .transition() // Smooth transition
        .duration(500)
        .attr("y", d => yScale(d.tremor_severity))
        .attr("height", d => height - yScale(d.tremor_severity));

    // Update existing bars
    bars.transition()
        .duration(500)
        .attr("x", d => xScale(d.condition))
        .attr("y", d => yScale(d.tremor_severity))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.tremor_severity))
        .attr("fill", d => colorScale(d.condition)); // Update color

    // Exit old bars
    bars.exit()
        .transition()
        .duration(500)
        .attr("y", height)
        .attr("height", 0)
        .remove();

    // Update axes
    xAxis.transition().duration(500).call(d3.axisBottom(xScale));
    yAxis.transition().duration(500).call(d3.axisLeft(yScale));
}