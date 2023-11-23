let selectedPlanetType = "all";
let globalData
// Load the data
d3.csv("data/cleaned_5250.csv").then(csvData => {
  globalData = csvData
  createVisualization(globalData);
});

document.getElementById("planetTypeFilter").addEventListener("change", function () {
  selectedPlanetType = this.value;
  updateVisualization();
});

function updateVisualization() {
  if (!globalData) {
      console.error("Data is not defined.");
      return;
  }

  const filteredData = (selectedPlanetType === "all")
      ? globalData
      : globalData.filter(d => d.planet_type === selectedPlanetType);

  createVisualization(filteredData);
}


function createVisualization(data) {
  d3.select("#visualization-svg").selectAll("*").remove();
  const container = d3.select("#visualization-container").node();
  const width = container.getBoundingClientRect().width;
  const numRows = Math.ceil(data.length / 10);
  const height = numRows * 80;
  const svg = d3.select("#visualization-svg")
  .attr("width", width)
  .attr("height", height);

  // Scales
  const radiusScale = d3.scaleLinear()
    .domain([d3.min(data, d => +d.radius_multiplier), d3.max(data, d => +d.radius_multiplier)])
    .range([5, 50]); // Flower size

  const stemLengthScale = d3.scaleLinear()
    .domain([d3.min(data, d => +d.distance), d3.max(data, d => +d.distance)])
    .range([20, 100]); // Stem length

  const petalCountScale = d3.scaleQuantize()
    .domain([d3.min(data, d => +d.mass_multiplier), d3.max(data, d => +d.mass_multiplier)])
    .range(d3.range(3, 8)); // Number of petals

  const discoveryYearScale = d3.scaleTime()
    .domain([d3.min(data, d => new Date(d.discovery_year, 0, 1)), d3.max(data, d => new Date(d.discovery_year, 0, 1))])
    .range([0, width]); // Flower position based on discovery year


  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "lightsteelblue")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("text-align", "center");
  // Creating flowers
  const flowers = svg.selectAll(".flower")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "flower")
    .attr("transform", (d, i) => `translate(${Math.max(discoveryYearScale(new Date(d.discovery_year, 0, 1)), 0)}, ${(i % numRows) * (height / numRows) + 50})`)
    .on("click", function (event, d) {
      onFlowerClick(d); 
    });

    flowers.each(function (d, i) {
      const flower = d3.select(this);
      const petalCount = petalCountScale(d.mass_multiplier);
      const petalSize = radiusScale(d.radius_multiplier);
      const petalPath = `M0,0 C-10,-10 -10,-${petalSize} 0,-${petalSize + 10} C10,-${petalSize} 10,-10 0,0`;
  
      flower.selectAll(".petal")
        .data(d3.range(petalCount).map(() => d))
        .enter()
        .append("path")
        .attr("class", "petal")
        .attr("d", petalPath)
        .attr("transform", (d, i) => `rotate(${i * (360 / petalCount)})`)
        .attr("fill", d => getColor(d.planet_type));
  });

  // Adding stems
  flowers.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", d => stemLengthScale(d.distance))
    .attr("stroke", "green")
    .attr("stroke-width", 2);

  flowers.on("mouseover", function (event, d) {
    d3.select(this).select("line")
      .transition()
      .duration(300)
      .attr("stroke-width", 4);
    tooltip.html(createTooltipContent(d))
      .style("visibility", "visible")
      .style("top", (event.pageY - 10) + "px")
      .style("left", (event.pageX + 10) + "px");
  })
    .on("mouseout", function () {
      d3.select(this).select("line")
        .transition()
        .duration(300)
        .attr("stroke-width", 2);
      tooltip.style("visibility", "hidden");
    });

  function createTooltipContent(d) {
    return `<strong>Exoplanet:</strong> ${d.name}<br>
            <strong>Type:</strong> ${d.planet_type}<br>
            <strong>Distance (light-years):</strong> ${d.distance}<br>`;
  }

}


function getColor(planetType) {

  switch (planetType.trim()) {
    case "Gas Giant":
      return "red";
    case "Terrestrial":
      return "grey";
    case "Neptune-like":
      return "blue";
    case "Super Earth":
      return "green";
    default:
      return "white"; 
  }
}

function displayModal(content) {
  const modalElement = document.getElementById("detailsModal");
  const modalBody = document.getElementById("modal-body");
  modalBody.innerHTML = content; 
  modalElement.style.display = "block"; 


  const closeButton = document.querySelector(".close-button");
  closeButton.onclick = function() {
      modalElement.style.display = "none";
  };
}

window.onclick = function(event) {
  const modalElement = document.getElementById("detailsModal");
  if (event.target == modalElement) {
      modalElement.style.display = "none";
  }
};
function displaySidebar(content) {
  const sidebarElement = document.getElementById("detailsSidebar");
  sidebarElement.innerHTML = content; 
  sidebarElement.style.display = "block"; 
}

function onFlowerClick(d) {

  const detailsHtml = `
    <h2>Exoplanet: ${d.name}</h2>
    <p>Type: ${d.planet_type}</p>
    <p>Distance: ${d.distance} light-years</p>
    <p>Stellar Magnitude: ${d.stellar_magnitude}</p>
    <p>Mass: ${d.mass_multiplier} times Jupiter's mass</p>
    <p>Radius: ${d.radius_multiplier} times Jupiter's radius</p>
    <p>Orbital Radius: ${d.orbital_radius} AU</p>
    <p>Orbital Period: ${d.orbital_period} days</p>
    <p>Eccentricity: ${d.eccentricity}</p>
    <p>Detection Method: ${d.detection_method}</p>
    <p>Discovery Year: ${d.discovery_year}</p>
    `;

  displaySidebar(detailsHtml);
}
window.onclick = function(event) {
  const sidebarElement = document.getElementById("detailsSidebar");
  if (event.target == sidebarElement) {
      sidebarElement.style.display = "none";
  }
};

function closeSidebar() {
  const sidebarElement = document.getElementById("detailsSidebar");
  sidebarElement.style.display = "none";
}
