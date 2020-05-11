import React, { Component } from 'react';
import * as d3 from 'd3';
import logo from './cappra.png';
import { extent } from 'd3';
export class MeasuresGraph extends Component {
  sheet =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZfix7TfjRVdf8g60n70oi_VhbK9HNr3XSgqwRdfRtIxeWIcTeizBhWHknN2TtAEF5_K9V8U-vx22/pub?gid=1248451647&single=true&output=csv';
  state = {
    data: [],
    width: 1000,
    height: 1000,
    innerHeight: 1000,
    innerWidth: 1000,
    margin: { right: 50, top: 120, left: 100, bottom: 240 },
    xScale: d3.scaleBand(),
    yScale: d3.scaleLinear(),
    yTimeScale: d3.scaleTime(),
  };

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    let data = d3.csv(this.sheet, function (dataPoint, i) {
      return dataPoint;
    });

    let width = d3.select('.svg-container').node().offsetWidth;
    let height = d3.select('.svg-container').node().offsetHeight;
    let innerHeight = height - this.state.margin.top - this.state.margin.bottom;
    let innerWidth = width - this.state.margin.left - this.state.margin.right;

    data.then((result, error) => {
      result.map(d => {
        let dateParts = d.Data.split('/');
        d.Data = `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`;
        d.Formated_Date = new Date(d.Data);
      }); // Parse Date objects

      let xScale = d3
        .scaleBand()
        .rangeRound([0, innerWidth])
        .padding(0.1)
        .domain(
          result.map(function (d) {
            return d.Data;
          })
        );

      const maxValues = d3.max([
        d3.max(result, d => Number(d.Novos_Casos)),
        d3.max(result, d => Number(d.UTI)),
      ]);

      let yScale = this.state.yScale
        .rangeRound([innerHeight, 0])
        .domain([0, maxValues]);

      const xTimeScale = this.state.yTimeScale
        .range([0, innerWidth])
        .domain(extent(result.map(d => d.Formated_Date)));

      this.setState({
        data: result,
        xScale,
        xTimeScale,
        yScale,
        width,
        height,
        innerHeight,
        innerWidth,
      });
    });
  }

  componentDidUpdate() {
    d3.select('.lineG').select('path').remove();

    let xAxisDay = d3
      .select(this.refs.xAxisDay)
      .call(d3.axisBottom(this.state.xScale).ticks(2));

    xAxisDay.selectAll('text').text(d => {
      let dateParts = d.split('/');
      return `${dateParts[1]}`;
    });

    xAxisDay.selectAll('line').remove();
    xAxisDay.selectAll('text').each(function (d, i) {
      if (i % 2 == 0) d3.select(this).remove();
    });

    let xAxisMonth = d3
      .select(this.refs.xAxisMonth)
      .call(d3.axisBottom(this.state.xScale).ticks(2));

    xAxisMonth
      .selectAll('text')
      .attr('dy', 30)
      .text(d => {
        let dateParts = d.split('/');
        return `${d3.timeFormat('%b')(new Date(d))}`;
      });
    xAxisMonth.selectAll('path').remove();
    xAxisMonth.selectAll('line').remove();
    xAxisMonth.selectAll('text').each(function (d, i) {
      if (i % 2 == 0) d3.select(this).remove();
    });

    let yAxis = d3.select(this.refs.yAxis).call(d3.axisLeft(this.state.yScale));

    yAxis.selectAll('line').remove();

    d3.select('.lineG')
      .append('path')
      .data([this.state.data])
      .attr(
        'd',
        d3
          .line()
          .x(d => {
            return this.state.yTimeScale(d.Formated_Date);
          })
          .y(d => {
            return this.state.yScale(d.UTI);
          })
      )
      .attr('fill', 'none')
      .attr('stroke', '#652292')
      .attr('stroke-width', '4px');
  }

  updateDimensions = () => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let innerHeight = height - this.state.margin.top - this.state.margin.bottom;
    let innerWidth = width - this.state.margin.left - this.state.margin.right;

    let xScale = d3
      .scaleBand()
      .rangeRound([0, innerWidth])
      .padding(0.1)
      .domain(
        this.state.data.map(function (d) {
          return d.Data;
        })
      );

    const maxValues = d3.max([
      d3.max(this.state.data, d => Number(d.Novos_Casos)),
      d3.max(this.state.data, d => Number(d.UTI)),
    ]);

    let yScale = this.state.yScale
      .rangeRound([innerHeight, 0])
      .domain([0, maxValues]);

    const xTimeScale = this.state.yTimeScale
      .range([0, innerWidth])
      .domain(extent(this.state.data.map(d => d.Formated_Date)));

    this.setState({
      width,
      height,
      innerHeight,
      innerWidth,
      xScale,
      yScale,
      xTimeScale,
    });
  };

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  renderTitle() {
    return (
      <g>
        <text
          className="mainTilte"
          x={this.state.innerWidth / 2}
          y={this.state.margin.top - 180}
          textAnchor="middle"
        >
          Covid-19: Casos diários e medidas tomadas em Porto Alegre
        </text>
        <text
          className="mainTilte"
          x={this.state.innerWidth}
          y={this.state.margin.top - 180}
          textAnchor="end"
          alignmentBaseline="central"
        >
          2020
        </text>
      </g>
    );
  }
  renderAxis(group) {
    return (
      <g>
        <g
          transform={`translate(0, ${this.state.innerHeight})`}
          ref="xAxisDay"
        ></g>
        <g
          transform={`translate(0, ${this.state.innerHeight - 5})`}
          ref="xAxisMonth"
        ></g>
        <g ref="yAxis"></g>
      </g>
    );
  }

  renderBars() {
    return (
      <g>
        {this.state.data.map(d => {
          return (
            <rect
              className="bar"
              x={this.state.xScale(d.Data)}
              y={this.state.yScale(Number(d.Novos_Casos))}
              width={this.state.xScale.bandwidth()}
              height={
                this.state.innerHeight -
                this.state.yScale(Number(d.Novos_Casos))
              }
              fill={'#5FDAD5'}
            ></rect>
          );
        })}
      </g>
    );
  }

  renderMeasureLine() {
    return (
      <g>
        {this.state.data.map(d => {
          return (
            <line
              className="measureLine"
              ref={d.Data}
              x1={this.state.xScale(d.Data) + this.state.xScale.bandwidth() / 2}
              x2={this.state.xScale(d.Data) + this.state.xScale.bandwidth() / 2}
              y1={0}
              y2={this.state.innerHeight}
              strokeWidth={5}
              stroke={d.Funcao == 'Fechar' ? '#FD3F44' : '#FFBE40'}
              strokeDasharray={'10, 5'}
              display={!d.Medida ? 'none' : 'inline'}
              onMouseOver={() => this.mouseOverMeasureLine(d)}
              onMouseOut={this.mouseOutMeasureLine}
            ></line>
          );
        })}
      </g>
    );
  }

  renderMeasureTooltip() {
    return (
      <foreignObject
        x={300}
        y={this.state.innerHeight + 70}
        width={this.state.innerWidth - 450}
        height={155}
      >
        <div className={'measureTextDiv'}>
          <p className="measureText measureTitle">Medida:</p>
          <p className="measureText measureValue"></p>
        </div>
      </foreignObject>
    );
  }

  mouseOverMeasureLine(d) {
    d3.select('.measureTextDiv').style('opacity', 1);
    d3.select('.measureValue').text(d.Medida);
    d3.selectAll('.measureLine').attr('opacity', 0.5);
    d3.select(this.refs[d.Data]).attr('opacity', 1);
  }

  mouseOutMeasureLine() {
    d3.select('.measureTextDiv')
      .transition()
      .delay(1000)
      .duration(750)
      .ease(d3.easeLinear)
      .style('opacity', 0);

    d3.selectAll('.measureLine').attr('opacity', 1);
  }

  renderFooter(group) {
    return (
      <g
        className="footerG"
        transform={`translate(0, ${this.state.innerHeight + 70})`}
      >
        <line className="subtitleLineClose" x1={0} y1={0} x2={20} y2={0}></line>
        <text
          className="subtitleLineTextClose"
          x={40}
          y={0}
          alignmentBaseline="central"
        >
          Medida de fechamento
        </text>
        <line
          className="subTitleLineOpen"
          x1={0}
          y1={35}
          x2={20}
          y2={35}
        ></line>
        <text
          className="subTitleTextOpen"
          x={40}
          y={35}
          alignmentBaseline="central"
        >
          Medida de abertura
        </text>

        <rect
          className="subTitleMiniBar"
          x={7}
          y={65}
          width={this.state.xScale.bandwidth() / 2}
          height={this.state.xScale.bandwidth() / 2}
        ></rect>
        <text
          className="subTitleTextMiniBar"
          x={40}
          y={70}
          alignmentBaseline="central"
        >
          Óbitos
        </text>

        <rect
          className="subtitleLine"
          x={7}
          y={105}
          width={this.state.xScale.bandwidth() / 2}
          height={'4px'}
        ></rect>
        <text
          className="subtitleTextLine"
          x={40}
          y={105}
          alignmentBaseline="central"
        >
          Internados na UTI
        </text>
        <image
          x={this.state.innerWidth - 120}
          y={115}
          href={logo}
          width={150}
        ></image>
        <text className="simular" x={-85} y={150} onClick={this.clickSimulator}>
          > SIMULAR FUTURO DE POA
        </text>
      </g>
    );
  }

  clickSimulator() {
    window.open('https://report-covid19-cappra.herokuapp.com', '_blank');
  }

  renderLine() {
    return <g className="lineG"></g>;
  }

  renderMiniBars() {
    return (
      <g>
        {this.state.data.map(d => {
          return (
            <rect
              className="miniBar"
              x={
                this.state.xScale(d.Data) +
                this.state.xScale.bandwidth() / 2 / 2
              }
              y={this.state.yScale(Number(d.Novos_Obitos))}
              width={this.state.xScale.bandwidth() / 2}
              height={
                this.state.innerHeight -
                this.state.yScale(Number(d.Novos_Obitos))
              }
              fill={'#FF8416'}
            ></rect>
          );
        })}
      </g>
    );
  }

  render() {
    return (
      <div className="svg-container">
        <svg
          width={this.state.width}
          height={this.state.height}
          className="svg-content-responsive"
        >
          <g
            className="main-group"
            transform={`translate(${this.state.margin.left}, ${this.state.margin.top})`}
          >
            {this.renderTitle()}
            {this.renderFooter()}
            {this.renderAxis()}
            {this.renderBars()}
            {this.renderMeasureLine()}
            {this.renderMeasureTooltip()}
            {this.renderMiniBars()}
            {this.renderLine()}
          </g>
        </svg>
      </div>
    );
  }
}
