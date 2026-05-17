import React from 'react';

/**
 * Represents a coding example with a title, source code, and programming language.
 */
interface ExampleProblem {
    title: string;
    code: string;
    language: string;
}

interface ExampleProblemsProps {
    onSelectExample: (code: string, language: string) => void;
}

// List of predefined example coding problems
const EXAMPLE_PROBLEMS: ExampleProblem[] = [
    {
        title: "Java method for addition",
        code: `public int add(int a, int b) {
  return a + b;
}`,
        language: "java"
    },
    {
        title: "Python function for calculating fibonacci series",
        code: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,
        language: "python"
    },
    {
        title: "C++ program to find factorial of a number",
        code: `int factorial(int n) {
    if (n == 0) {
        return 1;
    }
    return n * factorial(n - 1);
}`,
        language: "c++"
    },
    {
        title: "C++ program to check if a number is odd or even",
        code: `bool isEven(int n) {
    return n % 2 == 0;
}`,
        language: "c++"
    }
];


/**
 * ExampleProblems component displays a list of example coding problems.
 * Users can click on a problem to select it.
 * 
 * @param {ExampleProblemsProps} props - Component props.
 * @returns {JSX.Element} - Rendered component.
 */
const ExampleProblems: React.FC<ExampleProblemsProps> = ({ onSelectExample }) => {
    return (
        <div className="example-problems">
            <h3 className="text-lg font-semibold mb-3 text-[var(--heading-color)]">Example Problems</h3>
            <div className="example-list">
                {EXAMPLE_PROBLEMS.map((problem, index) => (
                    <button
                        key={index}
                        className="example-item"
                        onClick={() => onSelectExample(problem.code, problem.language)}
                    >
                        {problem.title}
                    </button>
                ))}
            </div>
        </div>
    );
};
export default ExampleProblems;
