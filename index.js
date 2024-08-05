document.addEventListener("DOMContentLoaded", function() {
    const svg = d3.select("svg");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const circleRadius = 3.5;
    const initialTreeWidth = 80;
    const initialTreeHeight = 120;
    const minTreeWidth = 10;
    const minTreeHeight = 14;

    // Load CSV data
    d3.csv("tree_ratio_all.csv").then(data => {
        try {
            data.forEach(d => {
                d.tree_ratio_rounded = +d.tree_ratio_rounded; // Convert tree_ratio_rounded to number
            });

            // Sort data alphabetically by neighborhood name (nta_name)
            data.sort((a, b) => d3.ascending(a.nta_name, b.nta_name));

            // Create dropdown options
            const dropdown = d3.select("#neighborhood");
            dropdown.selectAll("option")
                .data(data)
                .enter()
                .append("option")
                .attr("value", d => d.nta_name)
                .text(d => d.nta_name);

            // Select a random neighborhood initially
            const randomNeighborhood = data[Math.floor(Math.random() * data.length)].nta_name;
            updateVisualization(randomNeighborhood);
            dropdown.property("value", randomNeighborhood);

            // Update visualization on dropdown change with fade transition
            dropdown.on("change", function() {
                const selectedNeighborhood = this.value;
                svg.selectAll("circle, image")
                    .transition()
                    .duration(400)
                    .style("opacity", 0)
                    .on("end", () => updateVisualization(selectedNeighborhood));
            });

            function updateVisualization(neighborhood) {
                // Filter data based on selected neighborhood
                const filteredData = data.find(d => d.nta_name === neighborhood);
                const treeRatio = filteredData.tree_ratio_rounded;

                // Clear previous circles and tree images
                svg.selectAll("circle, image").remove();

                // Function to generate random positions
                function generateRandomPositions(count, radius, width, height, padding) {
                    const positions = [];
                    let attempts = 0;
                    const maxAttempts = count * 100; // Limit the number of attempts to prevent infinite loops

                    while (positions.length < count && attempts < maxAttempts) {
                        let x = Math.random() * (width - 2 * radius - padding) + radius + padding / 2;
                        let y = Math.random() * (height - 2 * radius - padding) + radius + padding / 2;
                        let valid = true;

                        for (const pos of positions) {
                            const dx = pos.x - x;
                            const dy = pos.y - y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < 2 * radius + padding) {
                                valid = false;
                                break;
                            }
                        }

                        if (valid) {
                            positions.push({ x, y });
                        }
                        attempts++;
                    }

                    if (positions.length < count) {
                        console.warn(`Could not place all items without overlap. Placed ${positions.length} out of ${count}.`);
                    }

                    return positions;
                }

                // Generate positions for circles (people)
                const circlePositions = generateRandomPositions(100, circleRadius, width, height, 2);

                // Function to try placing trees with decreasing size
                function tryPlacingTrees(treeRatio, treeWidth, treeHeight) {
                    let treePositions = generateRandomPositions(treeRatio, Math.max(treeWidth, treeHeight) / 2, width, height, 2);

                    while (treePositions.length < treeRatio && treeWidth > minTreeWidth && treeHeight > minTreeHeight) {
                        treeWidth *= 0.9;
                        treeHeight *= 0.9;
                        console.warn(`Reducing tree size to ${treeWidth}x${treeHeight} to fit all trees.`);
                        treePositions = generateRandomPositions(treeRatio, Math.max(treeWidth, treeHeight) / 2, width, height, 2);
                    }

                    return { treePositions, treeWidth, treeHeight };
                }

                // Try placing trees with initial size
                const { treePositions, treeWidth, treeHeight } = tryPlacingTrees(treeRatio, initialTreeWidth, initialTreeHeight);

                // Create circles (people)
                svg.selectAll("circle")
                    .data(circlePositions)
                    .enter()
                    .append("circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", circleRadius)
                    .attr("fill", "2E282A")
                    .attr("class", "person")
                    .style("opacity", 0)
                    .transition()
                    .duration(2500)
                    .style("opacity", 1);

                // Create tree images
                d3.xml("tree.svg").then(treeSVG => {
                    const treeNode = treeSVG.documentElement;

                    svg.selectAll("image")
                        .data(treePositions)
                        .enter()
                        .append("svg:image")
                        .attr("xlink:href", "tree.svg")
                        .attr("x", d => d.x - treeWidth / 2)
                        .attr("y", d => d.y - treeHeight / 2)
                        .attr("width", treeWidth)
                        .attr("height", treeHeight)
                        .style("opacity", 0)
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                }).catch(error => {
                    console.error("Error loading tree SVG:", error);
                });
            }
        } catch (error) {
            console.error("Error processing data:", error);
        }
    }).catch(error => {
        console.error("Error loading CSV data:", error);
    });
});
