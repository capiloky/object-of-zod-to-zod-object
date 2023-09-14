import { FieldValues } from "react-hook-form";
import { z } from "zod";

type FieldDef<TData extends FieldValues> = {
    id: Path<TData> | string;
    validation?: z.ZodTypeAny;
};

type RawObjectValidation = {
    [key: string]: RawObjectValidation | z.ZodTypeAny | undefined;
};

const fieldsToObject = <TData extends FieldValues>(
    fields: FieldDef<TData>[]
) => {
    return fields.reduce((acc, field) => {
        const keys = field.id.split(".");
        let obj = acc;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (i === keys.length - 1) {
                obj[key as string] = field.validation || z.any();
            } else {
                obj[key as string] = obj[key as string] || {};
                obj = obj[key as string] as RawObjectValidation;
            }
        }
        return acc;
    }, {} as RawObjectValidation);
};

const objectToZod = (obj: RawObjectValidation): z.ZodTypeAny => {
    const keys = Object.keys(obj).sort().reverse();

    if (keys.length === 0) {
        return z.any();
    }

    let schema = {};

    for (const key of keys) {
        if (obj[key] instanceof z.ZodType) {
            schema = { [key]: obj[key] || z.any(), ...schema };
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
            const childSchema = objectToZod(obj[key] as RawObjectValidation);
            schema = { [key]: childSchema, ...schema };
        }
    }

    return z.object(schema);
};

export function buildValidationSchema<TData extends FieldValues>(
    fields: FieldDef<TData>[]
) {
    return objectToZod(fieldsToObject(fields));
}

