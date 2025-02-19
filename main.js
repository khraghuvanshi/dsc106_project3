d3.csv("merged_data.csv").then(data => {
    console.log(data); // Inspect data structure

    let taskFilter = document.getElementById("taskFilter");
    
    function updateChart() {
        let filteredData = taskFilter.checked ? data : data.filter(d => d.task_name === "");
        
        let groupedData = d3.rollup(filteredData, v => v.length, d => d.patient_group);
        let barData = Array.from(groupedData, ([key, value]) => ({ group: key, count: value }));

        let width = 800, height = 400;
        let svg = d3.select("#barChart")
                    .attr("width", width)
                    .attr("height", height);
        
        let x = d3.scaleBand().domain(barData.map(d => d.group)).range([0, width]).padding(0.3);
        let y = d3.scaleLinear().domain([0, d3.max(barData, d => d.count)]).range([height, 0]);
        
        svg.selectAll(".bar").remove();
        
        svg.selectAll(".bar")
           .data(barData)
           .enter().append("rect")
           .attr("class", "bar")
           .attr("x", d => x(d.group))
           .attr("y", d => y(d.count))
           .attr("width", x.bandwidth())
           .attr("height", d => height - y(d.count))
           .attr("fill", "steelblue");
    }
    
    taskFilter.addEventListener("change", updateChart);
    updateChart();
});
