// Set up SVG dimensions
const svgWidth = 800;
const svgHeight = 600;
const margin = { top: 50, right: 30, bottom: 60, left: 60 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#barChart")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Initialize scales and axes
const xScale = d3.scaleBand().range([0, width]).padding(0.1);
const yScale = d3.scaleLinear().range([height, 0]);

const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxis = svg.append("g");

// Initialize gridlines
const gridlines = svg.append("g")
    .attr("class", "gridlines");

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

// Color scale for different conditions
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Load data from CSV
d3.csv("condition.csv").then(data => {
    data.forEach(d => {
        d.tremor_severity = +d.tremor_severity;
    });

    const taskNames = [...new Set(data.map(d => d.task_name))];
    const conditions = [...new Set(data.map(d => d.condition))];

    // Populate task dropdown
    const taskFilter = d3.select("#task-filter");
    taskNames.forEach(task => {
        taskFilter.append("option")
            .attr("value", task)
            .text(task);
    });

    // Populate condition checkboxes
    const conditionFilter = d3.select("#condition-checkboxes");
    conditions.forEach(condition => {
        conditionFilter.append("label")
            .html(`<input type="checkbox" class="condition-checkbox" value="${condition}" checked> ${condition}`)
            .style("margin-right", "10px");
    });

    const maxSeverity = d3.max(data, d => d.tremor_severity);
    yScale.domain([0, maxSeverity]);

    // Add gridlines
    gridlines.selectAll("line")
        .data(yScale.ticks())
        .enter()
        .append("line")
        .attr("class", "gridline")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1);

    updateChart(data);

    // Event listener for task dropdown
    taskFilter.on("change", filterAndUpdate);

    // Event listener for condition checkboxes
    d3.selectAll(".condition-checkbox").on("change", filterAndUpdate);

    function filterAndUpdate() {
        const selectedTask = taskFilter.property("value");
        const selectedConditions = [];
        d3.selectAll(".condition-checkbox:checked").each(function () {
            selectedConditions.push(this.value);
        });

        let filteredData = data;
        if (selectedTask !== "All") {
            filteredData = filteredData.filter(d => d.task_name === selectedTask);
        }
        if (selectedConditions.length > 0) {
            filteredData = filteredData.filter(d => selectedConditions.includes(d.condition));
        }

        updateChart(filteredData);
    }
}).catch(error => {
    console.error("Error loading CSV data:", error);
});

// Get tooltip element
const tooltip = d3.select(".tooltip");

// Update chart function
function updateChart(data) {
    const groupedData = d3.group(data, d => d.condition);
    const aggregatedData = Array.from(groupedData, ([condition, values]) => ({
        condition,
        tremor_severity: d3.mean(values, d => d.tremor_severity),
        max_tremor_severity: d3.max(values, d => d.tremor_severity), // Add max tremor severity
        task_name: values[0].task_name, // Add task name
        task_description: values[0].task_description // Add task description
    }));

    xScale.domain(aggregatedData.map(d => d.condition));

    const bars = svg.selectAll(".bar")
        .data(aggregatedData, d => d.condition);

        bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.condition))
        .attr("y", height) // Start from the bottom
        .attr("width", xScale.bandwidth())
        .attr("height", 0) // Start with zero height
        .attr("fill", d => colorScale(d.condition)) // Color by condition
        .on("mouseover", function(event, d) {
            // Show tooltip on hover
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <strong>Movement:</strong> ${d.task_name}<br>
                <strong>Description:</strong> ${d.task_description}<br>
                <strong>Max Severity:</strong> ${d.max_tremor_severity.toFixed(4)}
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Hide tooltip on mouseout
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
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

    xAxis.transition().duration(500).call(d3.axisBottom(xScale));
    yAxis.transition().duration(500).call(d3.axisLeft(yScale));
}
