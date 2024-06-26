import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';


export interface CommonResourcesStackProps extends StackProps {
  readonly prefix: string;
  readonly s3Suffix: string;
  readonly removalPolicy: RemovalPolicy;
  readonly runtime: Runtime;
}

export class CommonResourcesStack extends Stack {
  public readonly prefix: string;
  public readonly s3Suffix: string;
  public readonly removalPolicy: RemovalPolicy;
  public readonly runtime: Runtime;

  constructor(scope: Construct, id: string, props: CommonResourcesStackProps) {
    super(scope, id, props);

    this.prefix = props.prefix;
    this.s3Suffix = props.s3Suffix;
    this.runtime = props.runtime;
    this.removalPolicy = props.removalPolicy || RemovalPolicy.DESTROY;

    const customResourceLayer = new PythonLayerVersion(this, 'CustomResourceLayer', {
      entry: `resources/lambdas/custom_resource_layer`,
      description: `${props.prefix}-custom-resource Lambda Layer`,
      compatibleRuntimes: [props.runtime],
      layerVersionName: `${props.prefix}-custom-resource-layer`,
      removalPolicy: RemovalPolicy.RETAIN, // we need to keep the old layer version otherwise the custom resource will fail
    });

    new StringParameter(this, 'CustomResourceLayerSSMParameter', {
      parameterName: '/rdi-mlops/stack-parameters/custom-resource-layer-arn',
      stringValue: customResourceLayer.layerVersionArn,
      description: 'Custom Resource Lambda Layer ARN',
    });

    // Store in SSM Parameter Store project prefix and bucket suffix values
    new StringParameter(this, 'ProjectPrefixSSMParameter', {
      parameterName: `/rdi-mlops/stack-parameters/project-prefix`,
      stringValue: this.prefix,
      description: 'Prefix of the project',
    });

    new StringParameter(this, 'BucketSuffixSSMParameter', {
      parameterName: `/rdi-mlops/stack-parameters/bucket-suffix`,
      stringValue: this.s3Suffix,
      description: 'Suffix of the S3 buckets',
    });
  }
}
