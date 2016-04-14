/**
 * Created by Samuel Gratzl on 11.02.2016.
 */

var data = null; //will be set after they are loaded
const uiOptions = {
  xattr: 'mpg',
  yattr: 'hp',
  barattr: 'mpg', //attribute shown in the bar chart
  selection: null //currently selected object
};
//create scatterplot instance
const scatterPlot = createScatterPlot('#scatterPlot');
//create bar chart instance
const barChart = createBarChart('#barChart');

d3.csv('./data/mtcars.csv', function(error, _loaded) {
  //data wrangling of the dataset
  const columns = Object.keys(_loaded[0]);
  const numericColumns = columns.filter(function(d) { return d !== 'car';});

  _loaded.forEach(function(row) {
    //convert all columns except 'car' to number
    numericColumns.forEach(function(col) {
      row[col] = parseFloat(row[col]);
    });
  });

  data = _loaded;

  initUI(numericColumns);
  updateCharts();
});

function updateCharts() {
  //update the scatterplot
  scatterPlot(data, uiOptions.xattr, uiOptions.yattr, uiOptions.selection);
  //update the barchart
  barChart(data, 'car', uiOptions.barattr, uiOptions.selection);
}

/**
 * initializes the user interface and triggers updates during a change
 * @param columns the possible columns to choose
 */
function initUI(columns) {
  //create the options for a select element
  function createOptions(selector, defaultValue) {
      const select = d3.select(selector);
      //create options
      const options = select.selectAll('option').data(columns);
      options.enter().append('option');
      //String ~ function(d) { return d; }
      options.attr('value', String).text(String);
      options.exit().remove();
      //set the default selection
      select.property('selectedIndex', columns.indexOf(defaultValue));
  }
  createOptions('#xattr', uiOptions.xattr);
  createOptions('#yattr', uiOptions.yattr);
  createOptions('#barattr', uiOptions.barattr);

  //when a change happens update the chart
  d3.selectAll('#xattr, #yattr, #barattr').on('change', function() {
    const id = this.id;
    const value = columns[this.selectedIndex];
    if (id === 'xattr') {
      uiOptions.xattr = value;
    } else if (id === 'yattr'){
      uiOptions.yattr = value;
    } else if (id === 'barattr'){
      uiOptions.barattr = value;
    }

    updateCharts();
  });
}

/**
 * creates a scatterplot instance
 * @param baseSelector css selector for the base element where this plot should be appended
 * @return update method to update the plot
 */
function createScatterPlot(baseSelector) {
  const dims = {
    margin : 40,
    width: 300,
    height: 300
  };
  const svg = d3.select(baseSelector).append('svg')
              .attr({
                width: dims.width + dims.margin*2,
                height: dims.height + dims.margin*2
              });
  //create a root shifted element
  const root = svg.append('g').attr('transform','translate('+dims.margin+','+dims.margin+')');

  //create basic svg structure for the chart
  root.append('g').attr('class', 'axis xaxis').attr('transform', 'translate(0,'+dims.height+')');
  root.append('g').attr('class', 'axis yaxis');
  root.append('g').attr('class', 'chart');

  const xscale = d3.scale.linear().range([0, dims.width]);
  const yscale = d3.scale.linear().range([dims.height, 0]);

  const xaxis = d3.svg.axis().scale(xscale).orient('bottom');
  const yaxis = d3.svg.axis().scale(yscale).orient('left');

  /**
   * updates the scatterplot
   * @param data the dataset to visualize
   * @param xAttr the xAttr to use
   * @param yAttr the yAttr to use
   * @param selection the currently selected data object
   */
  function update(data, xAttr, yAttr, selection) {
    //update scales with the min/max of the selected attribute
    xscale.domain(d3.extent(data, function(d) { return d[xAttr]; }));
    yscale.domain(d3.extent(data, function(d) { return d[yAttr]; }));

    //update the chart
    const circles = root.select('g.chart').selectAll('circle').data(data);
    //enter
    const circles_enter = circles.enter().append('circle')
      .attr('r', 5)
      .on({
        mouseenter: function(d) {
          //when the mouse enters/hovers the circle set the current element as the selected one an trigger an update
          uiOptions.selection = d;
          updateCharts();
        },
        mouseleave: function(d) {
          uiOptions.selection = null;
          updateCharts();
        }
      });
    circles_enter.append('title'); //tooltip
    //update
    circles.transition().duration(1000).attr({
       cx: function(d) { return xscale(d[xAttr]); },
       cy: function(d) { return yscale(d[yAttr]); }
    });
    //add a class for the currently selected item
    circles.classed('selected', function(d) { return d === selection; });
    //create tooltip
    circles.select('title').text(function(d) { return d[xAttr] + ' / ' + d[yAttr]; });
    //exit
    circles.exit().remove();

    //update axis
    root.select('g.xaxis').call(xaxis);
    root.select('g.yaxis').call(yaxis);
  }

  return update;
}

/**
 * creates a barchart instance
 * @param baseSelector css selector for the base element where this plot should be appended
 * @return update method to update the plot
 */
function createBarChart(baseSelector) {
  const dims = {
    leftMargin: 200,
    bottomMargin: 30,
    width: 300,
    height: 600
  };
  const svg = d3.select(baseSelector).append('svg')
              .attr({
                width: dims.width + dims.leftMargin,
                height: dims.height + dims.bottomMargin
              });
  const root = svg.append('g').attr('transform','translate('+dims.leftMargin+','+0+')');

  root.append('g').attr('class', 'axis xaxis').attr('transform', 'translate(0,'+dims.height+')');
  root.append('g').attr('class', 'axis yaxis');
  root.append('g').attr('class', 'chart');

  const xscale = d3.scale.linear().range([0, dims.width]);
  const yscale = d3.scale.ordinal().rangeRoundBands([0, dims.height], 0.1);
  const xaxis = d3.svg.axis().scale(xscale).orient('bottom');
  const yaxis = d3.svg.axis().scale(yscale).orient('left');
  /**
   * updates the scatterplot
   * @param data the dataset to visualize
   * @param nameAttr the name attribute to use
   * @param yAttr the yAttr to use
   * @param selection the currently selected data object
   */
  function update(data, nameAttr, xAttr, selection) {
    //sort by the attribute
    data = data.slice().sort(function(a, b) { return d3.descending(a[xAttr], b[xAttr]); });

    //update scales
    xscale.domain(d3.extent(data, function(d) { return d[xAttr]; }));
    yscale.domain(data.map(function(d) { return d[nameAttr]}));

    //update the chart
    //use a key function to ensure that the same DOM element will be bound to the same object row, required for transitions
    const bars = root.select('g.chart').selectAll('rect.bar').data(data, function(d) { return d[nameAttr]; });
    //enter
    const bars_enter = bars.enter().append('rect')
      .classed('bar', true)
      .attr('x', 0)
      .on({
        mouseenter: function(d) {
          uiOptions.selection = d;
          updateCharts();
        },
        mouseleave: function(d) {
          uiOptions.selection = null;
          updateCharts();
        }
      });
    bars_enter.append('title'); //tooltip
    //update
    bars.transition().duration(1000).attr({
       width: function(d) { return xscale(d[xAttr]); },
       y: function(d) { return yscale(d[nameAttr]); },
       height: yscale.rangeBand()
    });
    bars.classed('selected', function(d) { return d === selection; });

    bars.select('title').text(function(d) { return d[nameAttr]+': '+d[xAttr]; });
    //exit
    bars.exit().remove();

    //update axis
    root.select('g.xaxis').transition().duration(1000).call(xaxis);
    root.select('g.yaxis').transition().duration(1000).call(yaxis);
  }

  return update;
}
