
function barChart(baseSelector) {
  var dims = {
    margin : 30,
    width: 500,
    height: 300
  };
  const svg = d3.select(baseSelector).append('svg')
              .attr({
                width: dims.width + margin*2,
                height: dims.height + margin*2
              });
  const root = svg.append('g').attr('transform','translate('+margin+','+margin+')');

  const xscale = d3.scale.ordinal().rangeRoundBands([0, dims.width]);
  const yscale = d3.scale.linear().range([height, 0]);
  const xaxis = d3.svg.axis().scale(xscale).orient('bottom');
  const yaxis = d3.svg.axis().scale(yscale).orient('left');

  function update(data) {

    xscale.domain()

    const bars = root.selectAll('rect.bar').data(data);
    //enter
    bars.enter().append('rect').classed('bar', true);
    //update
    bars.attr({
       x: function(d, i) { return xscale(i); }),
       y: function(d) { return yscale(d); }),
       width: ctx.xscale.rangeBand(),
       height: function(d, i) { return ctx.yscale.range()[0] - ctx.yscale(d); }),
     });
     //exit
     bars.exit().remove();
  }

  return update;
}
