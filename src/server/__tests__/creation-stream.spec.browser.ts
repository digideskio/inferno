import { expect } from 'chai';
import streamAsString from './../renderToString.stream';
import concatStream from 'concat-stream-es6';
import Component from './../../component/es2015';
import createElement from './../../factories/createElement';

class StatefulComponent extends Component<any, any> {
	render() {
		return createElement('span', null, `stateless ${ this.props.value }!`);
	}
}

const FunctionalComponent = ({ value }) => createElement('span', null, `stateless ${ value }!`);

interface ITestEntry {
	description: any;
	template: any;
	result: any;
}

describe('SSR Creation Streams - (non-JSX)', () => {
	const testEntries: ITestEntry[] =
	[
		{
			description: 'should render div with span child',
			template: () => createElement('div', null, createElement('span')),
			result: '<div><span></span></div>'
		}, {
			description: 'should render div with span child and styling',
			template: () => createElement('div', null, createElement('span', { style: 'border-left: 10px;' })),
			result: '<div><span style="border-left: 10px;"></span></div>'
		}, {
			description: 'should render div with span child and styling #2',
			template: () => createElement('div', null, createElement('span', { style: { borderLeft: 10 } })),
			result: '<div><span style="border-left:10px;"></span></div>'
		}, {
			description: 'should render div with span child and styling #3',
			template: () => createElement('div', null, createElement('span', { style: { fontFamily: 'Arial' } })),
			result: '<div><span style="font-family:Arial;"></span></div>'
		}, {
			description: 'should render div with span child (with className)',
			template: () => createElement('div', { className: 'foo' }, createElement('span', { className: 'bar' })),
			result: '<div class="foo"><span class="bar"></span></div>'
		}, {
			description: 'should render div with text child',
			template: () => createElement('div', null, 'Hello world'),
			result: '<div>Hello world</div>'
		}, {
			description: 'should render div with text child (XSS script attack)',
			template: () => createElement('div', null, 'Hello world <img src="x" onerror="alert(\'XSS\')">'),
			result: '<div>Hello world &lt;img src=&quot;x&quot; onerror=&quot;alert(&#039;XSS&#039;)&quot;&gt;</div>'
		}, {
			description: 'should render div with text children',
			template: () => createElement('div', null, 'Hello', ' world'),
			result: '<div>Hello<!----> world</div>'
		}, {
			description: 'should render a void element correct',
			template: () => createElement('input'),
			result: '<input>'
		}, {
			description: 'should render div with node children',
			template: () => createElement('div', null, createElement('span', null, 'Hello'), createElement('span', null, ' world!')),
			result: '<div><span>Hello</span><span> world!</span></div>'
		}, {
			description: 'should render div with node children #2',
			template: () => createElement('div', null, createElement('span', { id: '123' }, 'Hello'), createElement('span', { className: 'foo' }, ' world!')),
			result: '<div><span id="123">Hello</span><span class="foo"> world!</span></div>'
		}, {
			description: 'should render div with falsy children',
			template: () => createElement('div', null, 0),
			result: '<div>0</div>'
		}, {
			description: 'should render div with dangerouslySetInnerHTML',
			template: () => createElement('div', { dangerouslySetInnerHTML: { __html: '<span>test</span>' } }),
			result: '<div><span>test</span></div>'
		}, {
			description: 'should render a stateful component',
			template: (value) => createElement('div', null, createElement(StatefulComponent, { value })),
			result: '<div><span>stateless foo!</span></div>'
		}, {
			description: 'should render a stateless component',
			template: (value) => createElement('div', null, createElement(FunctionalComponent, { value })),
			result: '<div><span>stateless foo!</span></div>'
		}, {
			description: 'should render a stateless component with object props',
			template: (value) => createElement('a', { [value]: true }),
			result: '<a foo></a>'
		}, {
			description: 'should render with array text children',
			template: (value) => createElement('a', null, ['a', 'b']),
			result: '<a>a<!---->b</a>'
		}, {
			description: 'should render with array children containing an array of text children',
			template: (value) => createElement('a', null, [['a', 'b']]),
			result: '<a>a<!---->b</a>'
		}, {
			description: 'should render with array null children',
			template: (value) => createElement('a', null, ['a', null]),
			result: '<a>a</a>'
		}
	];

	testEntries.forEach(test => {
		it(test.description, () => {
			const container = document.createElement('div');
			const vDom = test.template('foo');
			return streamPromise(vDom).then(function (output) {
				document.body.appendChild(container);
				container.innerHTML = output as string;
				expect(output).to.equal(test.result);
				document.body.removeChild(container);
			});
		});
	});
});

function streamPromise(dom) {
	return new Promise(function (res, rej) {
		streamAsString(dom)
		.on('error', rej)
		.pipe(concatStream(function (buffer) {
			res(buffer.toString('utf-8'));
		}));
	});
}
