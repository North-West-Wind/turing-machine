import { expect, test } from 'vitest'
import { TransitionNode } from "../States/Transitions/TransitionNode"
import { HeadTransition, TransitionStatement } from "../States/Transitions/TransitionStatement"
import { TransitionGraph, TransitionKey, TransitionValue } from "../States/Transitions/TransitionGraph"

test('Test case 1: Create Transition node and get its state ID.', () => {
    const node = new TransitionNode(3);
    expect(node.StateID).toBe(3)
})

test('Test case 2: Create HeadTransition and get its read content.', () => {
    const headTransition = new HeadTransition('a', 'b', -2);
    expect(headTransition.Read).toBe('a')
})

test('Test case 3: Create TransitionStatement and get its conditions.', () => {
    const statement = new TransitionStatement(
        new TransitionNode(0), // Source node
        new TransitionNode(1), // Target node
        [
            // HeadTransition array
            new HeadTransition('0', '1', 1),
            new HeadTransition('2', '1', 3)
        ]
    );

    expect(statement.Conditions[0].Move).toBe(1);
    expect(statement.Conditions[1].Read).toBe('2');
    expect(statement.Source.StateID).toBe(0);
});

test('Test case 4: Create TransitionKey and TransitionValue objects.', () => {
    const key = new TransitionKey(
        new TransitionNode(2),
        "abaa"
    );

    const value = new TransitionValue(
        new TransitionNode(1),
        "abbb",
        [1, 2, 4, 5]
    )

    expect(key.Source.StateID).toBe(2);
    expect(key.HeadsReads).toBe("abaa");
    expect(value.HeadsWrites).toBe("abbb");
    expect(value.HeadsMoves).toStrictEqual([1, 2, 4, 5]);
});

test('Test case 5: Test AddTransition() and TryGetTransitionValue() success case', () => {
    const statement = new TransitionStatement(
        new TransitionNode(0), // Source node
        new TransitionNode(1), // Target node
        [
            // HeadTransition array
            new HeadTransition('1', '1', 1),
            new HeadTransition('2', '1', 3)
        ]
    );

    const graph = new TransitionGraph();
    graph.AddTransition(statement);

    const key = new TransitionKey(
        new TransitionNode(0),
        "12"
    );
    const status = graph.TryGetTransitionValue(key);

    expect(status.success).toBe(true);
    expect(status.value?.HeadsWrites).toBe("11");
    expect(status.value?.HeadsMoves).toStrictEqual([1, 3]);
});

test('Test case 6: Test AddTransition() and TryGetTransitionValue() failure case', () => {
    const graph = new TransitionGraph();

    const key = new TransitionKey(
        new TransitionNode(3),
        "bc"
    );
    const status = graph.TryGetTransitionValue(key);

    expect(status.success).toBe(false);
});