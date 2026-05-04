// Test validation with exact user data
const z = require('zod');

// Current validation schema
const registerSchema = z
  .object({
    first_name: z.string().min(2, 'Jina la kwanza linahitajika').trim(),
    last_name: z.string().min(2, 'Jina la mwisho linahitajika').trim(),
    username: z
      .string()
      .min(3, 'Username lazima iwe na herufi 3+')
      .regex(/^[a-zA-Z0-9_.@-]+$/, 'Username: herufi, namba, _ , @ na - tu')
      .transform(val => val.toLowerCase().trim()),
    email: z.string().email('Email si sahihi').trim().toLowerCase(),
    password: z
      .string()
      .min(8, 'Password lazima iwe na herufi 8+')
      .regex(/[A-Z]/, 'Password lazima iwe na herufi kubwa moja')
      .regex(/[0-9]/, 'Password lazima iwe na namba moja')
      .regex(/[^A-Za-z0-9]/, 'Password lazima iwe na alama moja (kama !@#)')
      .refine((val) => !/^\d+$/.test(val), 'Password isiyokuwa namba tu'),
    confirm_password: z.string(),
    role: z.enum(['TOURIST', 'LOCAL_GUIDE']),
    bio: z.string().optional(),
    location: z.string().optional(),
    avatar: z.any().optional().nullable(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords hazilingani',
    path: ['confirm_password'],
  });

// Test cases
const testCases = [
  {
    name: "User's exact data",
    data: {
      first_name: "JUMA",
      last_name: "DOJA", 
      username: "materugervas5@gmail.com",
      email: "materugervas5@gmail.com",
      password: "Juma@123",
      confirm_password: "Juma@123",
      role: "TOURIST",
      bio: "",
      location: "",
      avatar: null
    }
  },
  {
    name: "With whitespace",
    data: {
      first_name: " JUMA ",
      last_name: " DOJA ", 
      username: " materugervas5@gmail.com ",
      email: " materugervas5@gmail.com ",
      password: " Juma@123 ",
      confirm_password: " Juma@123 ",
      role: "TOURIST",
      bio: "",
      location: "",
      avatar: null
    }
  },
  {
    name: "Simple username",
    data: {
      first_name: "JUMA",
      last_name: "DOJA", 
      username: "juma123",
      email: "materugervas5@gmail.com",
      password: "Juma@123",
      confirm_password: "Juma@123",
      role: "TOURIST",
      bio: "",
      location: "",
      avatar: null
    }
  }
];

testCases.forEach((testCase, i) => {
  console.log(`\n=== Test ${i + 1}: ${testCase.name} ===`);
  console.log('Input data:', JSON.stringify(testCase.data, null, 2));
  
  const result = registerSchema.safeParse(testCase.data);
  console.log('Validation result:', result.success ? "✅ SUCCESS" : "❌ FAILED");
  
  if (!result.success) {
    console.log('\nErrors:');
    result.error.issues.forEach((issue, j) => {
      console.log(`  ${j + 1}. Field: ${issue.path.join('.')} - Message: ${issue.message}`);
    });
  } else {
    console.log('✅ All validations passed!');
    console.log('Transformed data:', JSON.stringify(result.data, null, 2));
  }
});
