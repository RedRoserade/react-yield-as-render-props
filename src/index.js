import React from "react";
import ReactDOM from "react-dom";

import "./styles.css";

const SomeContext = React.createContext();
const SomeOtherContext = React.createContext();

function AddTwo(props) {
  return props.children({ value: props.value + 2 });
}

function isGenerator(value) {
  return Symbol.iterator in value;
}

function generatorComponent(innerFn) {
  return function(props) {
    const generator = innerFn(props);

    if (!isGenerator(generator)) {
      return generator;
    }

    function runGenerator(value) {
      const iteration = generator.next(value);

      if (iteration.done) {
        // Final iteration, a.k.a., the return.
        // Return the resulting React element.
        const result = iteration.value;

        return result;
      } else {
        // A component was yielded. Recurse down the tree,
        // by cloning the component with render props, and passing it the children,
        // which is going to be this same function.
        const copy = React.cloneElement(iteration.value, {
          children: runGenerator
        });

        return copy;
      }
    }

    // Start iterating over the generator's values.
    return runGenerator(undefined);
  };
}

function* MyGenerator(props) {
  const { value: four } = yield <AddTwo value={2 + (props.value || 0)} />;

  if (four !== 4) {
    return <p>How the hell isn't 2 + 2 = 4?</p>;
  }

  const value = yield <SomeContext.Consumer />;
  const now = yield <SomeOtherContext.Consumer />;

  return (
    <div style={{ border: "1px solid black", padding: 5 }}>
      <p>
        I use generators. I got "{value}", and it is now "{now.toLocaleTimeString()}",
        according to my context.
      </p>
      <p>2 + 2 = {four}</p>

      {/* 
      Should work even with subcomponents that are themselves generators... 
      Provided they are wrapped using `generatorComponent`
      */}
      <div style={{ border: "1px solid black" }}>
        Sub-component, recursing...
        <MyGeneratorV2 value={5} />
      </div>
    </div>
  );
}

const MyGeneratorV2 = generatorComponent(MyGenerator);

const NonGenerator = generatorComponent(function(props) {
  return <p>Nothing to see here.</p>;
});

// Reason: It's meant to work with generators that don't yield. As a test.
// eslint-disable-next-line
const GeneratorWithNoYield = generatorComponent(function*(props) {
  return <p>I am a generator function that yields nothing.</p>;
});

class App extends React.Component {
  state = { value: "Hello world" };

  render() {
    return (
      <SomeContext.Provider value={this.state.value}>
        <SomeOtherContext.Provider value={new Date()}>
          <div className="App">
            <h1>Hello CodeSandbox</h1>
            <h2>Start editing to see some magic happen!</h2>
            <input
              type="text"
              value={this.state.value}
              onInput={e => this.setState({ value: e.currentTarget.value })}
            />
            <MyGeneratorV2 />
            <NonGenerator />
            <GeneratorWithNoYield />
          </div>
        </SomeOtherContext.Provider>
      </SomeContext.Provider>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
